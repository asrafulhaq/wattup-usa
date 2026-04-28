import { cn } from '@/lib/utils';
import Link from 'next/link';

// ─── Shared base styles ───────────────────────────────────────────────────────
const BASE =
    'inline-flex items-center justify-center font-bold text-[16px] leading-[130%] tracking-[-0.03em] rounded-[8px] transition-colors duration-300 whitespace-nowrap select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none';

// ─── Variant styles ───────────────────────────────────────────────────────────
const VARIANTS = {
    /** Blue fill — primary CTA on light backgrounds */
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-btn',
    /** White fill — CTA on dark/image backgrounds (e.g. CTA section) */
    white: 'bg-white hover:bg-gray-light text-dark shadow-btn',
    /** Outlined — subtle secondary action */
    outline:
        'border-2 border-primary text-primary hover:bg-primary hover:text-white',
} as const;

// ─── Size presets ─────────────────────────────────────────────────────────────
const SIZES = {
    /**
     * Default — h-[53px] with horizontal padding.
     * Used by: section CTAs, navbar, hero, CTA-section buttons.
     */
    md: 'h-[53px] px-8',
    /**
     * Small — used by image-overlay / card-slider buttons where
     * vertical space is tight (e.g. built-for-slider card).
     */
    sm: 'py-[12px] px-6',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

// ─── Shared prop interface ────────────────────────────────────────────────────
interface SharedProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Extra Tailwind classes merged last — use for width, margin, etc. */
    className?: string;
    children: React.ReactNode;
}

// ─── Link overload ────────────────────────────────────────────────────────────
interface WithHref extends SharedProps {
    href: string;
    /** forward any <a> props that next/link accepts */
    target?: string;
    rel?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

// ─── Button overload ──────────────────────────────────────────────────────────
interface WithoutHref extends SharedProps {
    href?: undefined;
    type?: 'button' | 'reset';
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
}

type WattupButtonProps = WithHref | WithoutHref;

/**
 * WattupButton — polymorphic CTA component.
 *
 * Renders as `<Link>` when `href` is supplied, otherwise as `<button>`.
 *
 * ### Usage
 * ```tsx
 * // Navigation CTA (Link)
 * <WattupButton href='/contact#contact-us'>Request Assessment</WattupButton>
 *
 * // Variant + size
 * <WattupButton href='/locations' variant='white' size='md'>Find a Charger</WattupButton>
 *
 * // Image-overlay card button (smaller)
 * <WattupButton href={card.cta.href} size='sm'>{card.cta.label}</WattupButton>
 *
 * // Plain button (no href)
 * <WattupButton type='button' onClick={handleClick}>Open Menu</WattupButton>
 * ```
 *
 * ### Variants
 * - `primary` (default) — blue fill, white text — use on light backgrounds
 * - `white` — white fill, dark text — use on dark/image backgrounds (CTAReady)
 * - `outline` — bordered, transparent fill
 *
 * ### Sizes
 * - `md` (default) — h-[53px] — standard CTA height across all sections
 * - `sm` — py-[12px] px-6 — compact, for image-overlay buttons
 */
export function WattupButton(props: WattupButtonProps) {
    const { variant = 'primary', size = 'md', className, children } = props;
    const cls = cn(BASE, VARIANTS[variant], SIZES[size], className);

    if (props.href !== undefined) {
        const { href, target, rel, onClick } = props as WithHref;
        return (
            <Link
                href={href}
                target={target}
                rel={rel}
                onClick={onClick}
                className={cls}>
                {children}
            </Link>
        );
    }

    const { type = 'button', onClick, disabled } = props as WithoutHref;
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cls}>
            {children}
        </button>
    );
}

/**
 * FormSubmitButton — always `<button type="submit">`.
 *
 * Kept separate from WattupButton because:
 * 1. Semantically it lives inside a `<form>` — type="submit" is always required.
 * 2. It has `self-start` flow alignment (not centered like navigation CTAs).
 * 3. Future iterations will add loading/disabled states specific to forms.
 *
 * ### Usage
 * ```tsx
 * <FormSubmitButton>Submit Inquiry</FormSubmitButton>
 * <FormSubmitButton className='mx-auto'>Submit</FormSubmitButton>
 * ```
 */
export function FormSubmitButton({
    children,
    className,
    disabled,
}: {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}) {
    return (
        <button
            type='submit'
            disabled={disabled}
            className={cn(
                BASE,
                VARIANTS.primary,
                'px-[28px] py-[16px] self-start',
                className
            )}>
            {children}
        </button>
    );
}

