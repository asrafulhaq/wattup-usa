'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MobileMenuCloseIcon, MobileMenuIcon } from '../icons/icons';

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            <nav className='absolute inset-x-0 top-0 z-50 text-white font-sans isolate pointer-events-auto'>
                <div className='container flex items-center justify-between pt-8'>
                    {/* Logo */}
                    <Link
                        href='/'
                        className='relative flex items-center h-6 w-36 shrink-0'>
                        <Image
                            src='/assets/images/logo.svg'
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
                                className='text-[16px] font-semibold tracking-[-0.03em] leading-[130%] hover:text-white/70 transition-colors'>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Contact Us - Right */}
                    <div className='hidden lg:flex items-center shrink-0'>
                        <Link
                            href='/contact'
                            className='text-[16px] font-semibold tracking-[-0.03em] leading-[130%] hover:text-white/70 transition-colors'>
                            Contact Us
                        </Link>
                    </div>

                    {/* Mobile Menu Icon */}
                    <button
                        className='lg:hidden shrink-0 touch-manipulation'
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label='Open mobile menu'>
                        <MobileMenuIcon />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className='fixed h-dvh px-4 pt-7 inset-0 z-100 bg-white text-dark  flex flex-col md:hidden'>
                    <div className='flex items-center justify-between mb-12'>
                        <div className='relative h-6 w-36'>
                            <Image
                                src='/assets/images/logo_dark.svg'
                                alt='WattUp Logo'
                                fill
                                className='object-left object-contain'
                            />
                        </div>
                        <button
                            className='p-px rounded-full bg-white shadow-btn hover:bg-white/10 transition-colors'
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label='Close mobile menu'>
                            <MobileMenuCloseIcon />
                        </button>
                    </div>

                    <div className='flex mt-[177px] flex-col justify-center items-center gap-3 text-2xl font-semibold tracking-tight'>
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className=' text-[24px] py-[10px] font-medium leading-[100%] tracking-[-3%] hover:text-primary transition-colors block'
                                onClick={() => setMobileMenuOpen(false)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className='mt-auto pb-8'>
                        <Link
                            href='/contact'
                            className='w-full flex items-center justify-center py-4 px-[28px] h-[53px] bg-primary text-white rounded-lg font-bold text-[16px] leading-[130%] hover:bg-primary-hover transition-colors shadow-btn'
                            onClick={() => setMobileMenuOpen(false)}>
                            Contact Us
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}

