'use client';

import { submitDriverInquiry, submitHostInquiry } from '@/app/_actions/contact-actions';
import { driverSchema, hostSchema, MESSAGE_MAX, type DriverFormData, type HostFormData } from '@/lib/validations/contact';
import { CheckboxIcon } from '@/components/icons/icons';
import { FadeUp } from '@/components/ui/fade-up';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

const ContactFormCentered = () => {
    const [activeTab, setActiveTab] = useState<'driver' | 'host'>('driver');

    return (
        <section id='contact-form' className='bg-white pb-23.75 md:py-20.5'>
            <div className='container mx-auto max-xs:text-left text-center'>
                <FadeUp>
                    <h2 className='max-md:headline-5 text-nowrap headline-dark mb-6'>
                        Still need help?
                        <br className='hidden md:block' /> Contact{' '}
                        <br className='block md:hidden' /> us directly
                    </h2>
                </FadeUp>
            </div>

            <FadeUp delay={0.2}>
                <div className='flex flex-col w-full mx-auto'>
                    {/* Tab Switcher */}
                    <div className='relative mx-auto flex bg-gray/30 rounded-[8px] p-1 mb-10'>
                        <div
                            className='absolute top-1 bottom-1 left-1 z-0 bg-black rounded-[8px] transition-all duration-500 ease-in-out shadow-sm'
                            style={{
                                width: 'calc(50% - 4px)',
                                transform:
                                    activeTab === 'driver'
                                        ? 'translateX(0)'
                                        : 'translateX(calc(100% + 0px))',
                            }}
                        />
                        <button
                            onClick={() => setActiveTab('driver')}
                            className={`relative z-10 w-42.5 px-5 py-3 rounded-[8px] text-[16px] transition-colors duration-500 ${
                                activeTab === 'driver'
                                    ? 'text-white font-bold'
                                    : 'text-dark/50 font-medium hover:text-dark'
                            }`}>
                            Driver Support
                        </button>
                        <button
                            onClick={() => setActiveTab('host')}
                            className={`relative w-42.5 z-10 px-5 py-3 rounded-[8px] text-[16px] transition-colors duration-500 ${
                                activeTab === 'host'
                                    ? 'text-white font-bold'
                                    : 'text-dark/50 font-medium hover:text-dark'
                            }`}>
                            Host Partnership
                        </button>
                    </div>

                    <div className='relative container max-w-138.75 mx-auto overflow-hidden'>
                        <div
                            key={activeTab}
                            className='transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4'>
                            {activeTab === 'driver' ? <DriverForm /> : <HostForm />}
                        </div>
                    </div>
                </div>
            </FadeUp>
        </section>
    );
};

// ─── Driver Support Form ──────────────────────────────────────────────────────

function DriverForm() {
    const [isPending, startTransition] = useTransition();
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        getValues,
        formState: { errors },
    } = useForm<DriverFormData>({
        resolver: zodResolver(driverSchema),
        defaultValues: { name: '', email: '', message: '', agreedToTerms: false },
    });

    const messageLen = watch('message')?.length ?? 0;

    const onSubmit = (values: DriverFormData) => {
        startTransition(async () => {
            setServerError('');
            const result = await submitDriverInquiry(values);
            if ('error' in result) {
                setServerError(result.error);
            } else {
                setSent(true);
            }
        });
    };

    if (sent) {
        return <SuccessBanner email={getValues('email')} onReset={() => setSent(false)} />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 w-full' noValidate>
            {serverError && <ErrorBanner message={serverError} />}

            <div className='flex flex-col gap-3'>
                <label className='input-label'>Name:</label>
                <input
                    {...register('name')}
                    type='text'
                    placeholder='Enter name'
                    className='input-field'
                    disabled={isPending}
                />
                {errors.name && <p className='text-xs text-red-600 -mt-1'>{errors.name.message}</p>}
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Email:</label>
                <input
                    {...register('email')}
                    type='email'
                    placeholder='Enter email'
                    className='input-field'
                    disabled={isPending}
                />
                {errors.email && <p className='text-xs text-red-600 -mt-1'>{errors.email.message}</p>}
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Message:</label>
                <div className='relative w-full'>
                    <textarea
                        {...register('message')}
                        placeholder='Enter your message'
                        rows={4}
                        maxLength={MESSAGE_MAX}
                        className='input-field pt-4 min-h-28.5 resize-none'
                        disabled={isPending}
                    />
                    <span className='absolute bottom-4 right-4 text-[16px] font-medium text-dark/50'>
                        {messageLen}/{MESSAGE_MAX}
                    </span>
                </div>
                {errors.message && <p className='text-xs text-red-600 -mt-1'>{errors.message.message}</p>}
            </div>

            <TermsField inputProps={register('agreedToTerms')} error={errors.agreedToTerms?.message} disabled={isPending} />

            <SubmitButton isPending={isPending} label='Submit Inquiry' />
        </form>
    );
}

// ─── Host Partnership Form ────────────────────────────────────────────────────

function HostForm() {
    const [isPending, startTransition] = useTransition();
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<HostFormData>({
        resolver: zodResolver(hostSchema),
        defaultValues: { companyName: '', location: '', parkingSpaces: '', contactInfo: '', agreedToTerms: false },
    });

    const contactLen = watch('contactInfo')?.length ?? 0;

    const onSubmit = (values: HostFormData) => {
        startTransition(async () => {
            setServerError('');
            const result = await submitHostInquiry(values);
            if ('error' in result) {
                setServerError(result.error);
            } else {
                setSent(true);
            }
        });
    };

    if (sent) {
        return <SuccessBanner onReset={() => setSent(false)} />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 w-full' noValidate>
            {serverError && <ErrorBanner message={serverError} />}

            <div className='flex flex-col gap-3'>
                <label className='input-label'>Company Name:</label>
                <input
                    {...register('companyName')}
                    type='text'
                    placeholder='Enter company name'
                    className='input-field'
                    disabled={isPending}
                />
                {errors.companyName && <p className='text-xs text-red-600 -mt-1'>{errors.companyName.message}</p>}
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Location:</label>
                <input
                    {...register('location')}
                    type='text'
                    placeholder='Enter location'
                    className='input-field'
                    disabled={isPending}
                />
                {errors.location && <p className='text-xs text-red-600 -mt-1'>{errors.location.message}</p>}
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Number of Parking Spaces:</label>
                <input
                    {...register('parkingSpaces')}
                    type='text'
                    placeholder='Enter number of parking spaces'
                    className='input-field'
                    disabled={isPending}
                />
                {errors.parkingSpaces && <p className='text-xs text-red-600 -mt-1'>{errors.parkingSpaces.message}</p>}
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Contact Info:</label>
                <div className='relative w-full'>
                    <textarea
                        {...register('contactInfo')}
                        placeholder='Enter your contact info'
                        rows={4}
                        maxLength={MESSAGE_MAX}
                        className='input-field pt-4 min-h-28.5 resize-none'
                        disabled={isPending}
                    />
                    <span className='absolute bottom-4 right-4 text-[16px] font-medium text-dark/50'>
                        {contactLen}/{MESSAGE_MAX}
                    </span>
                </div>
                {errors.contactInfo && <p className='text-xs text-red-600 -mt-1'>{errors.contactInfo.message}</p>}
            </div>

            <TermsField inputProps={register('agreedToTerms')} error={errors.agreedToTerms?.message} disabled={isPending} />

            <SubmitButton isPending={isPending} label='Submit Inquiry' />
        </form>
    );
}

// ─── Shared pieces ────────────────────────────────────────────────────────────

function TermsField({
    inputProps,
    error,
    disabled,
}: {
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
    error?: string;
    disabled?: boolean;
}) {
    return (
        <div className='flex flex-col gap-1.5'>
            <label className='flex items-center gap-2 cursor-pointer mt-2 group'>
                <div className='relative flex items-center justify-center w-4 h-4 shrink-0'>
                    <input
                        {...inputProps}
                        type='checkbox'
                        disabled={disabled}
                        className='peer absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full disabled:cursor-not-allowed'
                    />
                    <CheckboxIcon className='absolute inset-0 pointer-events-none peer-checked:opacity-0 transition-opacity' />
                    <div className='absolute inset-0 bg-primary rounded-[3.5px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity flex items-center justify-center'>
                        <svg
                            className='w-2.5 h-2.5 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='4'
                            strokeLinecap='round'
                            strokeLinejoin='round'>
                            <polyline points='20 6 9 17 4 12' />
                        </svg>
                    </div>
                </div>
                <span className='text-[16px] text-dark group-hover:text-dark/80 font-normal md:font-medium text-nowrap'>
                    I agree to the processing of my personal data
                </span>
            </label>
            {error && <p className='text-xs text-red-600'>{error}</p>}
        </div>
    );
}

function SubmitButton({ isPending, label }: { isPending: boolean; label: string }) {
    return (
        <button
            type='submit'
            disabled={isPending}
            className='mt-3 mx-auto h-14 px-8 rounded-[10px] bg-primary text-white text-[18px] font-bold tracking-tight transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-btn'>
            {isPending && <Loader2 size={20} className='animate-spin' />}
            {isPending ? 'Sending…' : label}
        </button>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className='flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3'>
            <svg className='mt-0.5 shrink-0' width='16' height='16' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='10' stroke='#ef4444' strokeWidth='2' />
                <path d='M12 8v4M12 16h.01' stroke='#ef4444' strokeWidth='2' strokeLinecap='round' />
            </svg>
            <p className='text-sm text-red-700 leading-relaxed'>{message}</p>
        </div>
    );
}

function SuccessBanner({ email, onReset }: { email?: string; onReset: () => void }) {
    return (
        <div className='flex flex-col items-center gap-6 py-10 text-center animate-in fade-in slide-in-from-bottom-4'>
            <CheckCircle2 size={48} className='text-emerald-500' />
            <div>
                <p className='text-[20px] font-semibold text-dark mb-1'>Inquiry sent!</p>
                <p className='text-[15px] text-dark/60 leading-relaxed'>
                    We&rsquo;ve received your message and will get back to you shortly.
                    {email && (
                        <>
                            <br />
                            A confirmation was sent to{' '}
                            <span className='font-medium text-dark/80'>{email}</span>.
                        </>
                    )}
                </p>
            </div>
            <button
                onClick={onReset}
                className='text-[14px] font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline'>
                Send another message
            </button>
        </div>
    );
}

export default ContactFormCentered;
