# wattup-proforma tests

The gate's guarantees, as a Vitest suite that runs with no services: no database, no
network, no email. `pnpm test` from this directory; `pnpm test:watch` while working.

| File | Pins | Checklist |
|---|---|---|
| `gate/request-code.test.ts` | member and non-member get the same bytes, and nothing address-dependent runs before the response, the `activity_log` write included; the send happens in `after()`, for a member only; the limiter's hit order; one `code.requested` or `code.refused` row per decision with the reason, none for a malformed body, and a rejected write changes nothing | 5.11, 5.5, 5.7a, 2.9, 5.8, 4b.5 |
| `gate/verify-code.test.ts` | every failure (Better Auth's codes, malformed input, the IP limit, a member removed mid-flow) is one 400 with one body; the re-check reads the just-issued session past the cookie cache and signs it out again; the code stays a string; one `signin.success` or `signin.failed` row per address-bearing request, written only after the response, with the reason mapped from Better Auth's code or the user row, byte-identical whether the write succeeds or rejects | 5.11, 2.19 to 2.21, 2.23, 2.29, 4b.5 |
| `tool/tool-route.test.ts` | signed out, `model.js` is a 302 with an empty body; signed in, it is the file's bytes; traversal, encoded traversal, backslash, NUL, dotfiles, directories and unlisted extensions are all 404 | 5.12 |
| `lib/require-member.test.ts` | a session is not membership: banned, removed or inactive is refused on the next request; `getSession` is asked to bypass the cookie cache | 5.13 |
| `lib/auth-config.test.ts` | what `lib/auth.ts` hands Better Auth: 6 digits, 600 s, 5 attempts, no sign-up, rotate, a keyed HMAC store, the send deferred with `after()`. The four behaviours only Better Auth can prove are `it.todo`, naming the live evidence | 5.14 (our side), 2.42 to 2.45 |
| `lib/safe-next.test.ts` | the open-redirect payload table resolves to `/tool/`; legitimate same-site paths pass literally | 2.23 |
| `lib/rate-limit.test.ts` | per source, global, gap (which does not consume the hour), per-IP request and verify buckets, IPv6 by /64, hashed keys, fail-open, the bounded memory map | 5.1 to 5.7 |
| `lib/gate-origin.test.ts` | `isSameOrigin` against the request's own host, `x-forwarded-host` first | 5.8 |
| `auth/all-route.test.ts` | `/api/auth/*` is `get-session` and `sign-out` and nothing else, including the encoded and traversed spellings | ADR 0001 section 7 |
| `lib/env.test.ts` | every required name, empty as missing, and the two numeric options | 2.9 |
| `lib/member-directory.test.ts` | both directories, the missing-view branch, and production ignoring the env list | 2.12, 4b.4 |
| `lib/activity-log.test.ts` | the row is written in full (`app: 'proforma'`, the full address, every field, explicit nulls); the user agent is cut at 512; a failed write never throws and logs the masked address with the correlation id; the missing table (P2021) is reported once per process | 4b.5, 4b.7 |

## How nothing real is reached

`tests/setup.ts` runs before every test file and does two things.

**The environment.** Every name `lib/env.ts` requires is set to a value that is plainly fake:
the "database" is port 1 on loopback, the Resend key is not a key. Nothing is read from `.env`,
and `NODE_ENV` is Vitest's `test`.

**The mocks**, registered with `vi.mock` in the setup file so no test file can forget one:

| Specifier | Replaced with | Lives in |
|---|---|---|
| `@/lib/prisma` | an object with only `user.findUnique`, `proformaMember.findUnique`, `activityLog.create`, `$queryRaw`, `$executeRaw`, each a `vi.fn`. `activityLog.create` resolves by default, and a test that scripts it to reject is asserting that the route's response did not change. The raw methods reject by default with the same P2010 "relation does not exist" the real database raises until checklist 5.7b is applied, so anything reaching the Postgres limiter takes the documented fail-open path | `mocks/prisma.ts` |
| `@/lib/auth` | `auth.api.{getSession, sendVerificationOTP, signInEmailOTP, signOut}` as `vi.fn`, scripted per test | `mocks/auth.ts` |
| `@/lib/member-directory` | the real module, with only `getMemberDirectory()` swapped for a function returning one scriptable `lookup` | `mocks/member-directory.ts` |
| `@/lib/email` | `sendOtpEmail` as a `vi.fn`, and a copy of `maskEmail` | `mocks/email.ts` |
| `next/server` | the real module, with `after()` swapped for a recorder: `runAfterCallbacks()` drains the queue, nested `after()` calls included | `mocks/next-server.ts` |
| `next/headers` | `headers()` returning what `setRequestHeaders()` was given; an inert `cookies()` | `mocks/next-headers.ts` |
| `resend`, `@prisma/adapter-pg` | constructors that throw. Guards, not stand-ins: if a test reaches them the suite is wrong | `setup.ts` |

Route handlers are plain `POST(request: Request)` / `GET(request: NextRequest, { params })`
functions, so a test builds a `Request` and calls them. `tests/helpers.ts` has the builder
(`gatePost`, same-origin JSON by default), a Better Auth session (`fakeSession`), a better-call
`APIError` shape (`apiError`), and `observable()`, which is everything a caller can see about a
response with the one per-request value (`x-correlation-id`) checked to be a UUID and then
replaced, so two responses that `toEqual` there are indistinguishable on the wire.

`tests/lib/auth-config.test.ts` is the one file that runs the real `lib/auth.ts`. It reaches it
with `vi.importActual` and replaces the `better-auth` packages with recorders, so what the module
passes to `betterAuth()` and `emailOTP()` is read back and nothing of Better Auth executes.

The gate logs every refusal by design. `setup.ts` silences `console.info/warn/error` as spies,
so a test can still assert on a log line; `TEST_VERBOSE=1 pnpm test` keeps the output.

## What is deliberately not here

- **Better Auth's verification store.** Five attempts, the ten minute expiry, no reuse, and
  rotation on resend are Better Auth honouring the options `lib/auth.ts` passes. They were
  proven live with real codes (checklist 2.43 to 2.45) and are `it.todo` here, so the suite
  says what it does not cover rather than pretending to.
- **The wire-level cookie expiry on the removed-mid-flow branch of verify-code.** The
  `nextCookies` plugin writes the sign-out's `Max-Age=0` cookies into Next's `cookies()` store
  and Next's route module merges that store into the response. None of that runs when `POST()`
  is called directly; the test pins that the handler's own response is identical to every other
  refusal, and that `signOut` was called with the just-issued cookie.
- **The login page.** A server component; its two decisions (`safeNext` on `?next=`,
  `requireMember` before redirecting) are covered at the function level.
- **The tool's own files.** `private/tool/**` is served byte-for-byte and never tested for
  content, only for being served or not.

## Running

```bash
pnpm test            # the suite, once
pnpm test:watch      # on change
pnpm typecheck       # tsc --noEmit; tsconfig.json includes tests/**
pnpm lint            # eslint; the Next config covers tests/** too
```

Tests are type-checked by `next build` as well, because `tsconfig.json` includes every `.ts`
file; keep them clean or the build breaks.
