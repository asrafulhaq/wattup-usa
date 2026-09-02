'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { OtpInput, type OtpInputHandle } from './otp-input';
import { safeNext } from '@/lib/safe-next';

/**
 * The two-step form on /login. Checklist 2.25 to 2.32.
 *
 * Step 1 takes an address and posts it to /api/gate/request-code. That route
 * answers 200 with one fixed body whether or not the address is a member (ADR
 * 0001 section 7), so this form advances on any 200 and never learns which it
 * was. The copy on step 2 promises nothing: a non-member sits on the code
 * screen, and that is the specified behaviour (checklist 2.26, 2.27).
 *
 * Step 2 takes a six-digit code and posts it to /api/gate/verify-code. The
 * code is a string from the input to the request body and is never coerced,
 * so '012345' stays '012345' (checklist 2.29). Every failure is one 400 with
 * one message, and this form shows that one message whatever the reason
 * (checklist 2.32). The x-correlation-id on the response is for support and
 * the logs; the page never displays it. Success is a same-site path, navigated
 * to with a full page load so the session cookie set by verify-code is sent on
 * the request that follows.
 *
 * `next` reaches this form already validated by the page, and goes through
 * safeNext again here at the moment of use, both in the verify body and in
 * navigation (checklist 2.0b). The path is never trusted raw.
 *
 * The look is wattup-frontend/components/auth/sign-in-form.tsx, copied by hand
 * on 2026-09-02 (ADR 0001 section 3: the apps share no code, so keep this in
 * sync by hand). Same header, label, field, submit, link and error banner,
 * with one deliberate change: the frontend's .input-label and .input-field
 * are built on --dark, a token its own .dark block leaves at #2d2d2d, so here
 * the same dimensions sit on the semantic tokens (foreground, muted,
 * muted-foreground, primary-foreground, destructive) and the screen flips with
 * the `dark` class. In the light scheme the two are indistinguishable.
 */

const CODE_LENGTH = 6;
const CODE_PATTERN = /^[0-9]{6}$/;
const RESEND_GAP_SECONDS = 60;

// The one message for everything that is not the gate's own answer: a network
// failure, the 503 from the env check, a body that is not JSON. Never the raw
// error.
const SOMETHING_WRONG = 'Something went wrong. Try again in a moment.';

type Step = 'email' | 'code';

type Reply = { kind: 'json'; status: number; body: Record<string, unknown> } | { kind: 'broken' };

/**
 * One POST, one shape back. 'broken' is anything that did not come back as a
 * JSON object: the network, a 503, a proxy page.
 */
async function postJson(path: string, payload: Record<string, string>): Promise<Reply> {
    let response: Response;
    try {
        response = await fetch(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch {
        return { kind: 'broken' };
    }
    const body: unknown = await response.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { kind: 'broken' };
    }
    return { kind: 'json', status: response.status, body: body as Record<string, unknown> };
}

// sign-in-form.tsx's .input-label, .input-field, submit button and
// "Forgot password?" link, on token names. rounded-md is --radius-md, the
// frontend's 0.75rem * 0.8; its literal 8px has no token.
const LABEL = 'text-[20px] leading-[130%] font-semibold tracking-[-3%] text-foreground';
const FIELD =
    'h-[56px] w-full rounded-md border border-transparent bg-muted px-5 text-[16px] leading-[130%] font-medium ' +
    'tracking-[-3%] text-foreground outline-none transition-colors placeholder:text-muted-foreground ' +
    'focus:border-primary aria-invalid:border-destructive';
const SUBMIT =
    'mt-2 flex h-[56px] w-full items-center justify-center gap-2 rounded-md bg-primary text-[18px] font-bold ' +
    'tracking-tight text-primary-foreground shadow-btn transition-all hover:bg-primary-hover active:scale-[0.98] ' +
    'disabled:cursor-not-allowed disabled:opacity-60';
const LINK =
    'text-[14px] font-normal! text-primary transition-colors disabled:cursor-not-allowed disabled:text-muted-foreground';

// lucide's Loader2, the spinner the sibling form shows while pending. One path,
// inlined rather than adding an icon library for a single glyph.
function Spinner() {
    return (
        <svg
            className="animate-spin"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

export function LoginForm({ next }: { next: string }) {
    const target = safeNext(next);
    const baseId = useId();
    const emailId = `${baseId}-email`;
    const codeId = `${baseId}-code`;
    const codeLabelId = `${baseId}-code-label`;
    const errorId = `${baseId}-error`;

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    // Bumped whenever the code field should be focused again. An effect does the
    // focusing, so it happens after the render that changed the value: calling focus
    // straight after setCode('') would land on the box the caret was in when the
    // code was still there, leaving the caret on box six while typing filled box one.
    const [focusNonce, setFocusNonce] = useState(0);
    // The address a code was last requested for, and when. The 60 s gap is a
    // server rule (lib/rate-limit.ts); this keeps the client from asking for a
    // code the server would refuse, and from wiping a code that is still good.
    const lastSentRef = useRef<{ address: string; at: number } | null>(null);

    const emailRef = useRef<HTMLInputElement>(null);
    const codeRef = useRef<OtpInputHandle>(null);

    // Focus follows the step: the address field on arrival, the code field the
    // moment step 2 appears.
    useEffect(() => {
        (step === 'code' ? codeRef : emailRef).current?.focus();
    }, [step]);

    // The other times the code field takes focus: after a refusal, which clears it, and
    // after a resend, which does not. Both go through the nonce so the focus runs on the
    // committed render rather than the one being replaced.
    useEffect(() => {
        if (focusNonce > 0) codeRef.current?.focus();
    }, [focusNonce]);

    // The resend cooldown, one second at a time. Client side only: the server's
    // real gap limit is enforced server-side in lib/rate-limit.ts (checklist 5.3), and this is the affordance that respects it.
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const codeComplete = CODE_PATTERN.test(code);

    async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;
        const address = email.trim();

        // Same address, inside the gap: the server would refuse the send anyway.
        // Go straight to step 2 with the remaining cooldown and the code intact.
        const last = lastSentRef.current;
        const remaining = last && last.address === address
            ? RESEND_GAP_SECONDS - Math.floor((Date.now() - last.at) / 1000)
            : 0;
        if (remaining > 0) {
            setEmail(address);
            setCooldown(remaining);
            setStep('code');
            return;
        }

        setPending(true);
        setFailure(null);
        const reply = await postJson('/api/gate/request-code', { email: address });
        setPending(false);

        if (reply.kind !== 'json' || reply.status !== 200) {
            setFailure(SOMETHING_WRONG);
            return;
        }
        // A 200 is the only answer the route gives, member or not. On to step 2,
        // with the resend cooldown already running from this first send.
        lastSentRef.current = { address, at: Date.now() };
        setEmail(address);
        setCode('');
        setCooldown(RESEND_GAP_SECONDS);
        setStep('code');
    }

    async function handleResend() {
        if (pending || cooldown > 0) return;

        setPending(true);
        setFailure(null);
        const reply = await postJson('/api/gate/request-code', { email });
        setPending(false);

        if (reply.kind !== 'json' || reply.status !== 200) {
            setFailure(SOMETHING_WRONG);
            return;
        }
        lastSentRef.current = { address: email, at: Date.now() };
        setCooldown(RESEND_GAP_SECONDS);
        // The field is left alone: a new code is on its way, but the old one
        // is not necessarily wrong yet and the member may still be reading it.
        setFocusNonce((n) => n + 1);
    }

    async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending || !codeComplete) return;

        setPending(true);
        setFailure(null);
        const reply = await postJson('/api/gate/verify-code', { email, code, next: target });

        if (reply.kind === 'json' && reply.status === 200 && typeof reply.body.redirectTo === 'string') {
            // A full navigation, not a client-side one, so the session cookie
            // verify-code just set goes out with the next request. Pending stays
            // on: this page is leaving.
            window.location.assign(safeNext(reply.body.redirectTo));
            return;
        }

        setPending(false);
        setCode('');
        // The gate's one refusal, in its own words, whatever the reason behind
        // it. Anything that is not that shape is the generic failure.
        setFailure(
            reply.kind === 'json' && reply.status === 400 && typeof reply.body.message === 'string'
                ? reply.body.message
                : SOMETHING_WRONG,
        );
        setFocusNonce((n) => n + 1);
    }

    function changeAddress() {
        if (pending) return;
        setStep('email');
        setCode('');
        setFailure(null);
        // The cooldown belongs to the address, not the step; it keeps counting.
    }

    // Always mounted, so assistive technology is already listening when a
    // message lands in it. The banner is the sibling form's server-error
    // banner on the destructive token, placed under the field it is about.
    const errorRegion = (
        <div id={errorId} aria-live="polite">
            {failure && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
                    <svg
                        className="mt-0.5 shrink-0"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <p className="text-sm leading-relaxed">{failure}</p>
                </div>
            )}
        </div>
    );

    if (step === 'email') {
        return (
            <div className="flex flex-col gap-7">
                {/* Header */}
                <div>
                    <h1 className="headline-3">Welcome back</h1>
                    <p className="text-description mt-1.5 font-normal!">Sign in to the Site Pro-Forma Builder</p>
                </div>

                <form onSubmit={handleEmailSubmit} aria-busy={pending} className="flex flex-col gap-6">
                    {/* Email */}
                    <div className="flex flex-col gap-3">
                        <label htmlFor={emailId} className={LABEL}>
                            Email address:
                        </label>
                        <input
                            ref={emailRef}
                            id={emailId}
                            name="email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="Enter email"
                            required
                            readOnly={pending}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            aria-describedby={failure ? errorId : undefined}
                            aria-invalid={failure ? true : undefined}
                            className={FIELD}
                        />
                        {errorRegion}
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={pending} className={SUBMIT}>
                        {pending && <Spinner />}
                        {pending ? 'Sending…' : 'Continue'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-7">
            {/* Header */}
            <div>
                <h1 className="headline-3">Enter your code</h1>
                <p className="text-description mt-1.5 font-normal!">
                    If that address is on the team list, a code is on its way. Codes expire in 10 minutes.
                </p>
            </div>

            <form onSubmit={handleCodeSubmit} aria-busy={pending} className="flex flex-col gap-6">
                {/* The address, read-only, with the way back */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className={LABEL}>Email address:</span>
                        <button type="button" onClick={changeAddress} disabled={pending} className={LINK}>
                            Use a different address
                        </button>
                    </div>
                    <p className="truncate text-[16px] leading-[130%] font-medium text-foreground" title={email}>
                        {email}
                    </p>
                </div>

                {/* Code */}
                <div className="flex flex-col gap-3">
                    <label htmlFor={codeId} id={codeLabelId} className={LABEL}>
                        One-time code:
                    </label>
                    <OtpInput
                        ref={codeRef}
                        id={codeId}
                        labelledBy={codeLabelId}
                        length={CODE_LENGTH}
                        value={code}
                        onChange={setCode}
                        disabled={pending}
                        invalid={Boolean(failure)}
                        describedBy={failure ? errorId : undefined}
                    />
                    {errorRegion}
                </div>

                {/* Submit */}
                <button type="submit" disabled={pending || !codeComplete} className={SUBMIT}>
                    {pending && <Spinner />}
                    {pending ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="text-center">
                    <button type="button" onClick={handleResend} disabled={pending || cooldown > 0} className={LINK}>
                        {cooldown > 0 ? `Send a new code in ${cooldown} s` : 'Send a new code'}
                    </button>
                </p>
            </form>
        </div>
    );
}
