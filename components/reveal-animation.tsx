'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface RevealProps {
    children: React.ReactNode;
    width?: 'fit-content' | '100%';
    delay?: number;
    duration?: number;
    yOffset?: number;
    className?: string;
}

export const Reveal = ({
    children,
    width = '100%',
    delay = 0.2,
    duration = 0.5,
    yOffset = 20,
    className,
}: RevealProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: duration,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className={className}
            style={{ width }}>
            {children}
        </motion.div>
    );
};

export const RevealList = ({
    children,
    delay = 0.1,
    staggerDelay = 0.1,
}: {
    children: React.ReactNode[];
    delay?: number;
    staggerDelay?: number;
}) => {
    return (
        <>
            {React.Children.map(children, (child, index) => (
                <Reveal delay={delay + index * staggerDelay} key={index}>
                    {child}
                </Reveal>
            ))}
        </>
    );
};

