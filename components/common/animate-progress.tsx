'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AnimatedProgressProps {
    target: number;
    className?: string;
}

export const AnimatedProgress = ({
    target,
    className,
}: AnimatedProgressProps) => {
    return (
        <div
            className={cn(
                'relative w-full h-1 bg-muted/20 overflow-hidden rounded-full',
                className
            )}>
            <motion.div
                className='absolute inset-0 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'
                initial={{ width: 0 }}
                animate={{ width: `${target}%` }}
                transition={{ 
                    type: 'spring', 
                    stiffness: 40, 
                    damping: 15,
                    mass: 0.5
                }}
            />
        </div>
    );
};
