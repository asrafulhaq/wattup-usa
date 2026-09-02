'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

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
 * (checklist 2.32); the x-correlation-id it carries is shown as a reference so
 * support can find the log line. Success is a same-site path, navigated to
 * with a full page load so the session cookie set by verify-code is sent on the
 * request that follows.
 *
 * `next` reaches this form already validated by the page, and goes through
 * safeNext again here at the moment of use, both in the verify body and in
 * navigation (checklist 2.0b). The path is never trusted raw.
 */

const CODE_LENGTH = 6;
const CODE_PATTERN = /^[0-9]{6}$/;
const RESEND_GAP_SECONDS = 60;

// The one message for everything that is not the gate's own answer: a network
// failure, the 503 from the env check, a body that is not JSON. Never the raw
// error.
const SOMETHING_WRONG = 'Something went wrong. Try again in a moment.';

type Step = 'email' | 'code';
type Failure = { message: string; reference: string | null };

type Reply =
    | { kind: 'json'; status: number; body: Record<string, unknown>; reference: string | null }
    | { kind: 'broken'; reference: string | null };

/**
 * One POST, one shape back. 'broken' is anything that did not come back as a
 * JSON object: the network, a 503, a proxy page. The correlation id is kept
 * whenever the response had one, whatever else it was.
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
        return { kind: 'broken', reference: null };
    }
    const reference = response.headers.get('x-correlation-id');
    const body: unknown = await response.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return { kind: 'broken', reference };
    }
    return { kind: 'json', status: response.status, body: body as Record<string, unknown>, reference };
}

const LABEL = 'mb-2 block text-[11px] font-medium uppercase tracking-[0.09em] text-text-3';
const INPUT =
    'w-full rounded-lg border border-line-2 bg-background px-[13px] py-[11px] text-[14px] text-foreground outline-none ' +
    'transition-[border-color] duration-[120ms] focus:border-blue focus:shadow-[0_0_0_3px_rgba(59,125,255,0.16)]';
const BUTTON =
    'mt-4 w-full cursor-pointer rounded-lg bg-blue p-3 text-[14px] font-bold text-white ' +
    'transition-[background-color] duration-[120ms] hover:bg-blue-hover disabled:cursor-default disabled:opacity-60 disabled:hover:bg-blue';
const LINK =
    'cursor-pointer text-[12.5px] font-medium text-blue hover:underline disabled:cursor-default disabled:text-text-3 disabled:no-underline';

export function LoginForm({ next }: { next: string }) {
    const target = safeNext(next);
    const baseId = useId();
    const emailId = `${baseId}-email`;
    const codeId = `${baseId}-code`;
    const errorId = `${baseId}-error`;

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [pending, setPending] = useState(false);
    const [failure, setFailure] = useState<Failure | null>(null);
    const [cooldown, setCooldown] = useState(0);

    const emailRef = useRef<HTMLInputElement>(null);
    const codeRef = useRef<HTMLInputElement>(null);

    // Focus follows the step: the address field on arrival, the code field the
    // moment step 2 appears (checklist item 11 of the spec).
    useEffect(() => {
        (step === 'code' ? codeRef : emailRef).current?.focus();
    }, [step]);

    // The resend cooldown, one second at a time. Client side only: the server's
    // real gap limit is phase 5, and this is the affordance that respects it.
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

        setPending(true);
        setFailure(null);
        const reply = await postJson('/api/gate/request-code', { email: address });
        setPending(false);

        if (reply.kind !== 'json' || reply.status !== 200) {
            setFailure({ message: SOMETHING_WRONG, reference: reply.reference });
            return;
        }
        // A 200 is the only answer the route gives, member or not. On to step 2.
        setEmail(address);
        setCode('');
        setStep('code');
    }

    async function handleResend() {
        if (pending || cooldown > 0) return;

        setPending(true);
        setFailure(null);
        const reply = await postJson('/api/gate/request-code', { email });
        setPending(false);

        if (reply.kind !== 'json' || reply.status !== 200) {
            setFailure({ message: SOMETHING_WRONG, reference: reply.reference });
            return;
        }
        setCooldown(RESEND_GAP_SECONDS);
        setCode('');
        codeRef.current?.focus();
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
                ? { message: reply.body.message, reference: reply.reference }
                : { message: SOMETHING_WRONG, reference: reply.reference },
        );
        codeRef.current?.focus();
    }

    function changeAddress() {
        if (pending) return;
        setStep('email');
        setCode('');
        setFailure(null);
        setCooldown(0);
    }

    // Always mounted, so assistive technology is already listening when a
    // message lands in it.
    const errorRegion = (
        <div id={errorId} aria-live="polite">
            {failure && (
                <div className="mt-[10px] flex items-start gap-2 rounded-lg border border-error-line bg-error-bg px-3 py-[10px] text-[12.5px] leading-[1.45] text-error-text">
                    <div>
                        <p>{failure.message}</p>
                        {failure.reference && (
                            <p className="mt-1 text-[11px] opacity-75">Reference: {failure.reference}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    if (step === 'email') {
        return (
            <>
                <p className="mb-[22px] text-[13px] leading-[1.5] text-text-2">
                    Internal underwriting tool. Enter your work email to continue.
                </p>
                <form onSubmit={handleEmailSubmit} aria-busy={pending}>
                    <label htmlFor={emailId} className={LABEL}>
                        Work email
                    </label>
                    <input
                        ref={emailRef}
                        id={emailId}
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        readOnly={pending}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-describedby={failure ? errorId : undefined}
                        className={INPUT}
                    />
                    {errorRegion}
                    <button type="submit" disabled={pending} className={BUTTON}>
                        {pending ? 'Sending…' : 'Continue'}
                    </button>
                </form>
            </>
        );
    }

    return (
        <>
            <p className="mb-[22px] text-[13px] leading-[1.5] text-text-2">
                If that address is on the team list, a code is on its way. Codes expire in 10 minutes.
            </p>
            <form onSubmit={handleCodeSubmit} aria-busy={pending}>
                <p className={LABEL}>Email</p>
                <div className="mb-[18px] flex items-baseline justify-between gap-3">
                    <span className="truncate text-[14px]" title={email}>
                        {email}
                    </span>
                    <button type="button" onClick={changeAddress} disabled={pending} className={`${LINK} shrink-0`}>
                        Use a different address
                    </button>
                </div>

                <label htmlFor={codeId} className={LABEL}>
                    One-time code
                </label>
                <input
                    ref={codeRef}
                    id={codeId}
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={CODE_LENGTH}
                    required
                    readOnly={pending}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
                    aria-invalid={failure ? true : undefined}
                    aria-describedby={failure ? errorId : undefined}
                    className={`${INPUT} tracking-[0.3em]`}
                />
                {errorRegion}
                <button type="submit" disabled={pending || !codeComplete} className={BUTTON}>
                    {pending ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="mt-[14px] text-center">
                    <button type="button" onClick={handleResend} disabled={pending || cooldown > 0} className={LINK}>
                        {cooldown > 0 ? `Send a new code in ${cooldown} s` : 'Send a new code'}
                    </button>
                </p>
            </form>
        </>
    );
}
