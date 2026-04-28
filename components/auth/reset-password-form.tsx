'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { z } from 'zod';
import { resetPassword } from '@/app/_actions/auth-actions';

const schema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') ?? '';
    const [isPending, startTransition] = useTransition();
    const [done, setDone] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showCpw, setShowCpw] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Values>({
        resolver: zodResolver(schema),
    });

    const onSubmit = (values: Values) => {
        if (!token) {
            setServerError('Invalid or missing reset token. Please request a new link.');
            return;
        }
        startTransition(async () => {
            setServerError('');
            const data = new FormData();
            data.append('token', token);
            data.append('password', values.password);
            const result = await resetPassword(data);
            if (result.success) {
                setDone(true);
                setTimeout(() => router.replace('/admin'), 2500);
            } else {
                setServerError(result.error || 'Failed to reset password. The link may have expired.');
            }
        });
    };

    if (done) {
        return (
            <div className='flex flex-col items-center text-center gap-4 py-4'>
                <CheckCircle2 size={44} className='text-emerald-500' />
                <div>
                    <p className='font-semibold text-foreground text-base'>Password updated!</p>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Redirecting you to sign in…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            {!token && (
                <div className='rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700'>
                    No reset token found. Please use the link from your email.
                </div>
            )}

            {serverError && (
                <div className='rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700'>
                    {serverError}
                </div>
            )}

            {/* New password */}
            <div className='flex flex-col gap-3'>
                <label htmlFor='rp-password' className='input-label'>
                    New password:
                </label>
                <div className='relative'>
                    <input
                        id='rp-password'
                        type={showPw ? 'text' : 'password'}
                        autoComplete='new-password'
                        placeholder='Min. 8 characters'
                        className='input-field pr-12'
                        {...register('password')}
                    />
                    <button
                        type='button'
                        onClick={() => setShowPw(!showPw)}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-dark/50 hover:text-dark transition-colors'
                        tabIndex={-1}
                    >
                        {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errors.password && (
                    <p className='text-xs text-red-600 mt-1'>{errors.password.message}</p>
                )}
            </div>

            {/* Confirm password */}
            <div className='flex flex-col gap-3'>
                <label htmlFor='rp-confirm' className='input-label'>
                    Confirm password:
                </label>
                <div className='relative'>
                    <input
                        id='rp-confirm'
                        type={showCpw ? 'text' : 'password'}
                        autoComplete='new-password'
                        placeholder='Re-enter password'
                        className='input-field pr-12'
                        {...register('confirmPassword')}
                    />
                    <button
                        type='button'
                        onClick={() => setShowCpw(!showCpw)}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-dark/50 hover:text-dark transition-colors'
                        tabIndex={-1}
                    >
                        {showCpw ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className='text-xs text-red-600 mt-1'>{errors.confirmPassword.message}</p>
                )}
            </div>

            <button
                type='submit'
                disabled={isPending || !token}
                className='mt-2 h-[56px] w-full rounded-[8px] bg-primary text-white text-[18px] font-bold tracking-tight transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-btn'
            >
                {isPending && <Loader2 size={20} className='animate-spin' />}
                {isPending ? 'Updating…' : 'Update Password'}
            </button>
        </form>
    );
}
