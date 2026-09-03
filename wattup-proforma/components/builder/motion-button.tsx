'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';

/**
 * The header controls, with press and hover physics.
 *
 * `motion.create` wraps the real Button rather than a div around it, which
 * matters: Radix's `asChild` triggers clone their single child to attach the
 * menu's handlers and ref, so a wrapper element would swallow them and the
 * dropdowns would stop opening.
 *
 * A spring rather than a CSS transition for the same reason the rail's sections
 * use one: it can be interrupted. Clicking a control repeatedly stays continuous
 * instead of restarting an ease each time.
 */
const MotionButtonBase = motion.create(Button);

/** Firm and short. A header control should feel clicked, not animated. */
const PRESS = { type: 'spring' as const, stiffness: 620, damping: 32, mass: 0.5 };

/**
 * React's drag and animation DOM handlers collide with Motion's own props of the
 * same names, so they are dropped from the surface. Nothing in the header uses
 * them, and leaving them in makes the component impossible to type.
 */
type MotionButtonProps = Omit<
    ComponentProps<typeof Button>,
    | 'onDrag'
    | 'onDragStart'
    | 'onDragEnd'
    | 'onDragEnter'
    | 'onDragExit'
    | 'onDragLeave'
    | 'onDragOver'
    | 'onDrop'
    | 'onAnimationStart'
    | 'onAnimationEnd'
    | 'onAnimationIteration'
>;

export function MotionButton(props: MotionButtonProps) {
    const reduced = useReducedMotion();

    if (reduced) return <Button {...props} />;

    return (
        <MotionButtonBase
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95, y: 0 }}
            transition={PRESS}
            {...props}
        />
    );
}
