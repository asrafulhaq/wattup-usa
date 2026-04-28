'use client';

import { authClient } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const signInSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInValues>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = (values: SignInValues) => {
        startTransition(async () => {
            setServerError('');

            const { error } = await authClient.signIn.email({
                email: values.email,
                password: values.password,
                callbackURL: '/dashboard',
            });

            if (error) {
                setServerError(error.message || 'Invalid email or password');
            } else {
                // Hard navigation so the browser sends the fresh session cookie
                const params = new URLSearchParams(window.location.search);
                window.location.href =
                    params.get('callbackUrl') || '/dashboard';
            }
        });
    };

    return (
        <div className='flex flex-col gap-7'>
            {/* Header */}
            <div>
                <h1 className='headline-3'>Welcome back</h1>
                <p className='mt-1.5 text-description font-normal!'>
                    Sign in to your WattUp admin account
                </p>
            </div>

            {/* Error banner */}
            {serverError && (
                <div className='flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3'>
                    <svg
                        className='mt-0.5 shrink-0'
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'>
                        <circle
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='#ef4444'
                            strokeWidth='2'
                        />
                        <path
                            d='M12 8v4M12 16h.01'
                            stroke='#ef4444'
                            strokeWidth='2'
                            strokeLinecap='round'
                        />
                    </svg>
                    <p className='text-sm text-red-700 leading-relaxed'>
                        {serverError}
                    </p>
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                className='flex flex-col gap-6'>
                {/* Email */}
                <div className='flex flex-col gap-3'>
                    <label htmlFor='si-email' className='input-label'>
                        Email address:
                    </label>
                    <input
                        id='si-email'
                        type='email'
                        autoComplete='email'
                        placeholder='Enter email'
                        className='input-field'
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className='text-xs text-red-600 mt-0.5'>
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className='flex flex-col gap-3'>
                    <div className='flex items-center justify-between'>
                        <label htmlFor='si-password' className='input-label'>
                            Password:
                        </label>
                        <Link
                            href='/forgot-password'
                            className='text-[14px] font-normal! transition-colors text-primary'>
                            Forgot password?
                        </Link>
                    </div>
                    <div className='relative'>
                        <input
                            id='si-password'
                            type={showPassword ? 'text' : 'password'}
                            autoComplete='current-password'
                            placeholder='Enter password'
                            className='input-field pr-12'
                            {...register('password')}
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-4 top-1/2 -translate-y-1/2 text-dark/50 hover:text-dark transition-colors'
                            tabIndex={-1}>
                            {showPassword ? (
                                <EyeOff size={20} />
                            ) : (
                                <Eye size={20} />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className='text-xs text-red-600 mt-0.5'>
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type='submit'
                    disabled={isPending}
                    className='mt-2 h-[56px] w-full rounded-[8px] bg-primary text-white text-[18px] font-bold tracking-tight transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-btn'>
                    {isPending && (
                        <Loader2 size={20} className='animate-spin' />
                    )}
                    {isPending ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
        </div>
    );
}



