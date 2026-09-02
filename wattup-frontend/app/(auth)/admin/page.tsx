import { SignInForm } from '@/components/auth/sign-in-form';
import { CopyrightYear } from '@/components/common/copyright-year';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Sign In | WattUp',
    description: 'Sign in to your WattUp admin account.',
};

export default function SignInPage() {
    return (
        <div className='min-h-screen flex'>
            {/* Left decorative panel */}
            <div className='hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#0f1117] flex-col justify-between p-12'>
                {/* Geometric grid background */}
                <div
                    className='absolute inset-0 opacity-[0.04]'
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
                {/* Gradient orbs */}
                <div className='absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[#197dff]/20 blur-[120px] pointer-events-none' />
                <div className='absolute bottom-1/4 right-0 w-[280px] h-[280px] rounded-full bg-[#197dff]/10 blur-[80px] pointer-events-none' />

                {/* Logo */}
                <div className='relative z-10'>
                    <Link href='/' className='inline-block'>
                        <Image
                            src={'/assets/images/shared/logo.svg'}
                            alt='WattUp Logo'
                            width={140}
                            height={40}
                            className=''
                        />
                    </Link>
                </div>

                {/* Center content */}
                <div className='relative z-10 flex-1 flex flex-col justify-center'>
                    <div className='space-y-6'>
                        <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 font-medium tracking-wide'>
                            <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
                            Admin Portal
                        </div>
                        <h2 className='headline-white font-bold text-white leading-[110%] tracking-tight'>
                            Manage your
                            <br />
                            <span className='text-primary'>EV charging</span>
                            <br />
                            network
                        </h2>
                        <p className='text-white/50 text-description font-normal! leading-relaxed max-w-xs'>
                            Access real-time analytics, host management, and
                            fleet insights all in one place.
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className='mt-10 flex flex-wrap gap-2'>
                        {[
                            'Analytics',
                            'Host Management',
                            'Fleet Solutions',
                            'Real-time Data',
                        ].map(f => (
                            <span
                                key={f}
                                className='px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-xs text-white/50 font-medium'>
                                {f}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Footer quote */}
                <div className='relative z-10'>
                    <p className='text-white/30 text-xs leading-relaxed'>
                        &ldquo;The future of mobility starts here.&rdquo;
                    </p>
                </div>
            </div>

            {/* Right form panel */}
            <div className='flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white'>
                {/* Mobile logo */}
                <div className='lg:hidden mb-12'>
                    <Link href='/'>
                        <Image
                            src={'/assets/images/shared/logo_dark.svg'}
                            alt='WattUp Logo'
                            width={140}
                            height={40}
                        />
                    </Link>
                </div>

                <div className='w-full max-w-[400px]'>
                    <SignInForm />
                </div>

                <p className='mt-10 text-xs text-muted-foreground text-center'>
                    &copy;{' '}
                    <Suspense fallback={'2026'}>
                        <CopyrightYear />
                    </Suspense>{' '}
                    WattUp USA. All rights reserved.{' '}
                    <Link
                        href='/policy'
                        className='underline underline-offset-2 hover:text-foreground transition-colors'>
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
}

