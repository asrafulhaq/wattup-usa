import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { CopyrightYear } from '@/components/common/copyright-year';
import { ChevronLeft } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Reset Password | WattUp',
    description: 'Set a new password for your WattUp account.',
};

export default function ResetPasswordPage() {
    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-light px-4'>
            <div className='w-full max-w-[440px] py-12 flex flex-col items-center'>
                {/* Logo */}
                <div className='mb-10'>
                    <Link href='/'>
                        <Image
                            src={'/assets/images/shared/logo_dark.svg'}
                            alt='WattUp Logo'
                            width={160}
                            height={46}
                        />
                    </Link>
                </div>

                {/* Back link */}
                <div className='w-full mb-6'>
                    <Link
                        href='/admin'
                        className='inline-flex items-center gap-1.5 text-sm text-dark/60 hover:text-dark transition-colors group font-medium'>
                        <ChevronLeft
                            size={16}
                            className='group-hover:-translate-x-0.5 transition-transform'
                        />
                        Back to Sign In
                    </Link>
                </div>

                {/* Card */}
                <div className='bg-white rounded-md p-8 w-full'>
                    <h1 className='text-2xl font-semibold text-dark tracking-tight mb-2'>
                        Set new password
                    </h1>
                    <p className='text-[15px] text-dark/70 mb-8 leading-relaxed'>
                        Choose a strong password. It must be at least 8
                        characters.
                    </p>

                    <Suspense
                        fallback={
                            <div className='h-24 animate-pulse rounded-xl bg-border/40' />
                        }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>

                <p className='mt-8 text-xs text-dark/40 text-center'>
                    &copy;{' '}
                    <Suspense fallback={'2026'}>
                        <CopyrightYear />
                    </Suspense>{' '}
                    WattupUSA. All rights reserved.
                </p>
            </div>
        </div>
    );
}

