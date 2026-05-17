'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function DashboardFadeIn({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
            style={{ width: '100%' }}>
            {children}
        </motion.div>
    );
}
