'use client';

import {
    useImperativeHandle,
    useRef,
    type ClipboardEvent,
    type KeyboardEvent,
    type Ref,
} from 'react';

/**
 * The six-box one-time-code field on the sign-in screen.
 *
 * A single text input worked, but a code arriving by email is read in one glance and
 * typed in one burst, and six boxes are what a person expects to see: each digit lands
 * in its own place, a wrong one is obvious, and the shape of the field says how long
 * the code is without any copy saying so.
 *
 * The value stays ONE STRING in the parent, not six pieces of state. The boxes are a
 * rendering of that string, so the submit guard, the pattern check and the request body
 * are exactly what they were before this component existed.
 *
 * What it has to get right, because each of these is a way a real person enters a code:
 *
 *   typing      a digit fills the focused box and moves on; the last one stays put.
 *   overtyping  typing into a filled box replaces that digit rather than being ignored.
 *   pasting     the usual case, since the code is copied out of an email. A paste
 *               anywhere fills from the first box, and it is accepted even when it
 *               arrives with spaces or a stray letter around it.
 *   autofill    the browser and iOS both offer the code from the message. Chrome fills
 *               the whole value into the first box, which is the same path as a paste;
 *               `autocomplete="one-time-code"` is on that box for it to find.
 *   backspace   clears the focused box, or steps back and clears that one when the
 *               focused box is already empty. Nothing is silently skipped over.
 *   arrows      move between boxes; Home and End jump to the ends.
 *
 * Accessibility: the boxes are one labelled group rather than six unrelated inputs, so
 * a screen reader announces "One-time code" once and then which digit it is on. The
 * error message is described once, on the group; the invalid state sits on the boxes,
 * because role="group" does not support aria-invalid.
 */

// ─── The rules, as pure functions ─────────────────────────────────────────────
//
// Every edit below is a string in and a string out, plus where the caret should go
// next. Keeping them out of the handlers is what makes them testable without a DOM:
// tests/login/otp-input.test.ts drives these directly, and the component is left as
// the thin part that moves focus and draws boxes.

export type Edit = { value: string; focus: number };

/** Digits only, capped at `length`. */
function clean(raw: string, length: number): string {
    return raw.replace(/[^0-9]/g, '').slice(0, length);
}

/**
 * A paste or an autofill landing at `start`: whatever came before it is kept, the
 * incoming digits follow, and the caret lands after the last one.
 */
export function fillEdit(value: string, start: number, incoming: string, length: number): Edit {
    const digits = clean(incoming, length);
    if (digits === '') return { value, focus: start };
    const next = (value.slice(0, start) + digits).slice(0, length);
    return { value: next, focus: Math.min(next.length, length - 1) };
}

/**
 * One box changing. A single character replaces that box and moves on; anything longer
 * is autofill or a paste the browser routed through onChange, so it fills from here.
 */
export function changeEdit(value: string, index: number, raw: string, length: number): Edit {
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits === '') return { value, focus: index };
    if (digits.length > 1) return fillEdit(value, index, digits, length);
    const next = (value.slice(0, index) + digits + value.slice(index + 1)).slice(0, length);
    return { value: next, focus: Math.min(index + 1, length - 1) };
}

/**
 * Backspace. A filled box is emptied in place; an already empty one steps back and
 * empties the box before it, so holding backspace walks the code out one digit at a
 * time rather than stalling.
 */
export function backspaceEdit(value: string, index: number): Edit {
    if ((value[index] ?? '') !== '') {
        return { value: value.slice(0, index) + value.slice(index + 1), focus: index };
    }
    if (index === 0) return { value, focus: 0 };
    return { value: value.slice(0, index - 1) + value.slice(index), focus: index - 1 };
}

/** Delete: empties the focused box and stays put. */
export function deleteEdit(value: string, index: number): Edit {
    return { value: value.slice(0, index) + value.slice(index + 1), focus: index };
}

export type OtpInputHandle = { focus: () => void };

export function OtpInput({
    id,
    length,
    value,
    onChange,
    disabled = false,
    invalid = false,
    describedBy,
    labelledBy,
    ref,
}: {
    /** Goes on the first box, so the visible label's htmlFor lands somewhere real. */
    id: string;
    length: number;
    /** Digits entered so far, 0 to `length` of them. The parent owns it. */
    value: string;
    onChange: (next: string) => void;
    disabled?: boolean;
    invalid?: boolean;
    describedBy?: string;
    labelledBy?: string;
    ref?: Ref<OtpInputHandle>;
}) {
    const boxes = useRef<(HTMLInputElement | null)[]>([]);

    // The parent focuses this field on arrival, after a failure and after a resend. It
    // should land on the first empty box, which is where typing would continue.
    useImperativeHandle(ref, () => ({
        focus() {
            const target = Math.min(value.length, length - 1);
            boxes.current[target]?.focus();
            boxes.current[target]?.select();
        },
    }));

    const digits = Array.from({ length }, (_, index) => value[index] ?? '');

    function focusBox(index: number): void {
        const clamped = Math.max(0, Math.min(index, length - 1));
        const box = boxes.current[clamped];
        box?.focus();
        box?.select();
    }

    /** Apply one of the pure edits above: set the value, then move the caret. */
    function apply(edit: Edit): void {
        if (edit.value !== value) onChange(edit.value);
        focusBox(edit.focus);
    }

    function handleChange(index: number, raw: string): void {
        apply(changeEdit(value, index, raw, length));
    }

    function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>): void {
        switch (event.key) {
            case 'Backspace':
                event.preventDefault();
                return apply(backspaceEdit(value, index));
            case 'Delete':
                event.preventDefault();
                return apply(deleteEdit(value, index));
            case 'ArrowLeft':
                event.preventDefault();
                return focusBox(index - 1);
            case 'ArrowRight':
                event.preventDefault();
                return focusBox(index + 1);
            case 'Home':
                event.preventDefault();
                return focusBox(0);
            case 'End':
                event.preventDefault();
                return focusBox(value.length);
            default:
                return;
        }
    }

    function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>): void {
        event.preventDefault();
        // From the first box a paste replaces the whole code, which is what pasting a
        // freshly copied code means. From a later box it fills from there.
        apply(fillEdit(value, index === 0 ? 0 : index, event.clipboardData.getData('text'), length));
    }

    return (
        <div
            role="group"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            className="flex gap-2 sm:gap-3"
        >
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(element) => {
                        boxes.current[index] = element;
                    }}
                    id={index === 0 ? id : undefined}
                    // One name would post six values, so only the first carries it; the
                    // form is submitted through fetch from the parent's state anyway.
                    name={index === 0 ? 'code' : undefined}
                    type="text"
                    inputMode="numeric"
                    // On the first box only: the browser and iOS fill the whole code
                    // into it, which handleChange spreads across the rest.
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    pattern="[0-9]*"
                    // Not maxLength=1: autofill and paste need to deliver six characters
                    // through this input before the handler spreads them.
                    aria-label={`Digit ${index + 1} of ${length}`}
                    // On the boxes rather than the group: aria-invalid is not a
                    // supported attribute of role="group", and it is each box that
                    // holds a digit of the code that was refused.
                    aria-invalid={invalid ? true : undefined}
                    value={digit}
                    readOnly={disabled}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={(event) => handlePaste(index, event)}
                    onFocus={(event) => event.target.select()}
                    className={
                        'h-[56px] min-w-0 flex-1 rounded-md border bg-muted text-center text-[22px] font-semibold ' +
                        'tracking-tight text-foreground outline-none transition-colors ' +
                        'focus:border-primary ' +
                        (invalid ? 'border-destructive' : 'border-transparent')
                    }
                />
            ))}
        </div>
    );
}
