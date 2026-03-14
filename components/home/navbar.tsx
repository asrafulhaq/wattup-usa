'use client';

import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: 'Home', href: '/' },
        { label: 'For Drivers', href: '/drivers' },
        { label: 'For Hosts', href: '/hosts' },
        { label: 'Locations', href: '/locations' },
        { label: 'About', href: '/about' },
    ];

    return (
        <>
            <nav className='absolute inset-x-0 top-0 z-50 text-white font-sans'>
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
                    <div className='lg:hidden flex items-center shrink-0'>
                        <button
                            className='text-white p-2 hover:bg-white/10 rounded-md transition-colors'
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label='Open mobile menu'>
                            <Menu className='w-6 h-6' />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className='fixed inset-0 z-100 bg-foreground text-white p-6 flex flex-col md:hidden'>
                    <div className='flex items-center justify-between mb-12'>
                        <div className='relative h-6 w-32'>
                            <Image
                                src='/assets/images/logo.svg'
                                alt='WattUp Logo'
                                fill
                                className='object-left object-contain'
                            />
                        </div>
                        <button
                            className='p-2 hover:bg-white/10 rounded-md transition-colors'
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label='Close mobile menu'>
                            <X className='w-6 h-6' />
                        </button>
                    </div>

                    <div className='flex flex-col gap-6 text-2xl font-semibold tracking-tight'>
                        {navLinks.map(link => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className='hover:text-primary transition-colors block'
                                onClick={() => setMobileMenuOpen(false)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className='mt-auto pb-8'>
                        <Link
                            href='/contact'
                            className='w-full flex items-center justify-center py-4 bg-primary text-white rounded-lg font-bold text-lg hover:bg-primary-hover transition-colors shadow-btn'
                            onClick={() => setMobileMenuOpen(false)}>
                            Contact Us
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}

