'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
];

const Navigation = () => {
    const pathname = usePathname();
    if (
        pathname.includes('/posts') ||
        pathname.includes('/privacy-policy') ||
        pathname.includes('/disclaimer')
    )
        return null;
    return (
        <nav className='flex border-b border-border  pt-8'>
            {links.map(link => {
                const isActive =
                    pathname === link.href ||
                    (link.href === '/' && pathname === '/search');
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`relative text-[14px] leading-[18px]  tracking-[-1%] uppercase p-3 transition-colors ${
                            isActive
                                ? 'text-foreground'
                                : 'text-text-muted hover:text-foreground'
                        }`}>
                        {link.label}
                        {isActive && (
                            <motion.div
                                layoutId='active-nav'
                                className='absolute bottom-0 left-0 right-0 h-px bg-primary -mb-px z-10'
                                transition={{
                                    type: 'spring',
                                    stiffness: 380,
                                    damping: 30,
                                }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
};

export default Navigation;

