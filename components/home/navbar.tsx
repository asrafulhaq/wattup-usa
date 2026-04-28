'use client';

import { WattupButton } from '@/components/ui/wattup-button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

export function Navbar() {
    return (
        <Suspense fallback={null}>
            <NavbarContent />
        </Suspense>
    );
}

function NavbarContent() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const params = useParams();
    const pathname = usePathname();

    const isPressReleaseDetails =
        pathname.includes('/press-release/') && params.slug ? true : false;

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);
    const navLinks = [
        { label: 'Home', href: '/' },
        { label: 'For Drivers', href: '/for-drivers' },
        { label: 'For Hosts', href: '/for-hosts' },
        { label: 'Locations', href: '/locations' },
        { label: 'About', href: '/about' },
    ];

    return (
        <>
            <nav className='absolute inset-x-0 top-0 max-md:-mt-3 z-100 text-white font-sans pointer-events-none'>
                <div className='container flex items-center justify-between pt-8 pointer-events-auto'>
                    {/* Logo */}
                    <Link
                        href='/'
                        className='relative flex items-center h-6 w-36 shrink-0'>
                        <Image
                            src={
                                isPressReleaseDetails
                                    ? '/assets/images/shared/logo_dark.svg'
                                    : '/assets/images/shared/logo.svg'
                            }
                            alt='WattUp Logo'
                            fill
                            className='object-left object-contain mix-blend-plus-lighter'
                            priority
                        />
                    </Link>

                    {/* Desktop Menu - Centered absolutely within the nav */}
                    <div className='hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-7'>
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={cn(
                                    'text-[16px] font-semibold tracking-[-0.03em] leading-[130%] hover:text-white/90 transition-colors',
                                    isPressReleaseDetails &&
                                        'text-dark hover:text-dark/80'
                                )}>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Contact Us - Right */}
                    <div className='hidden lg:flex items-center shrink-0'>
                        <Link
                            href='/contact'
                            className={cn(
                                'text-[16px] font-semibold tracking-[-0.03em] leading-[130%] hover:text-white/90 transition-colors',
                                isPressReleaseDetails &&
                                    'text-dark hover:text-dark/80'
                            )}>
                            Contact Us
                        </Link>
                    </div>

                    {/* Mobile Menu Icon */}
                    <button
                        className={cn(
                            'lg:hidden text-white text-[16px] leading-[130%] tracking-[-3%] py-[10px] font-semibold shrink-0 touch-manipulation',
                            isPressReleaseDetails &&
                                'text-dark hover:text-dark/80'
                        )}
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label='Open mobile menu'>
                        {/*  <MobileMenuIcon /> */}
                        Menu
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className='fixed h-dvh px-4 pt-7 inset-0 z-100 bg-white text-dark  flex flex-col md:hidden'>
                    <div className='flex items-center justify-between mb-12'>
                        <div className='relative h-6 w-36'>
                            <Image
                                src='/assets/images/shared/logo_dark.svg'
                                alt='WattUp Logo'
                                fill
                                className='object-left object-contain'
                            />
                        </div>
                        <button
                            className='p-px rounded-full text-dark transition-colors text-[16px] leading-[130%] tracking-[-3%] font-semibold shrink-0 touch-manipulation'
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label='Close mobile menu'>
                            {/*  <MobileMenuCloseIcon /> */}
                            Close
                        </button>
                    </div>

                    <div className='flex mt-[177px] flex-col justify-center items-center gap-3 text-2xl font-semibold tracking-tight'>
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={cn(
                                    'text-[24px] py-[10px] font-medium leading-[100%] tracking-[-3%] hover:text-dark/80 transition-colors block'
                                )}
                                onClick={() => setMobileMenuOpen(false)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className='mt-auto pb-8'>
                        <WattupButton
                            href='/contact'
                            className='w-full'
                            onClick={() => setMobileMenuOpen(false)}>
                            Contact Us
                        </WattupButton>
                    </div>
                </div>
            )}
        </>
    );
}

