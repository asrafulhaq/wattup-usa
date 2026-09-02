'use client';

import { requestPasswordReset } from '@/app/_actions/auth-actions';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<Values>({
        resolver: zodResolver(schema),
    });

    const onSubmit = (values: Values) => {
        startTransition(async () => {
            setServerError('');
            const data = new FormData();
            data.append('email', values.email);
            const result = await requestPasswordReset(data);
            if (result.success) {
                setSent(true);
            } else {
                setServerError(
                    result.error || 'Something went wrong. Please try again.'
                );
            }
        });
    };

    if (sent) {
        return (
            <div className='flex flex-col items-center text-center gap-4 py-4'>
                <CheckCircle2 size={44} className='text-emerald-500' />
                <div>
                    <p className='font-semibold text-foreground text-base'>
                        Check your inbox
                    </p>
                    <p className='text-sm text-muted-foreground mt-1 leading-relaxed'>
                        We sent a reset link to{' '}
                        <span className='font-medium text-foreground'>
                            {getValues('email')}
                        </span>
                        . Check your spam folder if you don&apos;t see it.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            {serverError && (
                <div className='rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700'>
                    {serverError}
                </div>
            )}

            <div className='flex flex-col gap-3'>
                <label htmlFor='fp-email' className='input-label'>
                    Email address:
                </label>
                <input
                    id='fp-email'
                    type='email'
                    autoComplete='email'
                    placeholder='Enter email'
                    className='input-field'
                    {...register('email')}
                />
                {errors.email && (
                    <p className='text-xs text-red-600 mt-1'>
                        {errors.email.message}
                    </p>
                )}
            </div>

            <button
                type='submit'
                disabled={isPending}
                className='mt-2 h-[56px] w-full rounded-[8px] bg-primary text-white text-[18px] font-bold tracking-tight transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-btn'>
                {isPending && <Loader2 size={20} className='animate-spin' />}
                {isPending ? 'Sending…' : 'Send Reset Link'}
            </button>
        </form>
    );
}

