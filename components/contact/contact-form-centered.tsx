'use client';

import {
    type DriverFormData,
    type HostFormData,
    driverSchema,
    hostSchema,
    submitDriverInquiry,
    submitHostInquiry,
} from '@/app/_actions/contact-actions';
import { CheckboxIcon } from '@/components/icons/icons';
import { FadeUp } from '@/components/ui/fade-up';
import { FormSubmitButton } from '@/components/ui/wattup-button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const MESSAGE_MAX = 500;

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
                            className={`relative z-10 w-[170px] px-[20px] py-[12px] rounded-[8px] text-[16px] transition-colors duration-500 ${
                                activeTab === 'driver'
                                    ? 'text-white font-bold'
                                    : 'text-dark/50 font-medium hover:text-dark'
                            }`}>
                            Driver Support
                        </button>
                        <button
                            onClick={() => setActiveTab('host')}
                            className={`relative w-[170px] z-10 px-[20px] py-[12px] rounded-[8px] text-[16px] transition-colors duration-500 ${
                                activeTab === 'host'
                                    ? 'text-white font-bold'
                                    : 'text-dark/50 font-medium hover:text-dark'
                            }`}>
                            Host Partnership
                        </button>
                    </div>

                    <div className='relative container max-w-[555px] mx-auto overflow-hidden'>
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
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<DriverFormData>({
        resolver: zodResolver(driverSchema),
        defaultValues: { agreedToTerms: undefined },
    });

    const messageLen = watch('message')?.length ?? 0;

    const onSubmit = (data: DriverFormData) => {
        startTransition(async () => {
            const result = await submitDriverInquiry(data);
            if ('error' in result) {
                toast.error(result.error);
            } else {
                setSubmitted(true);
                reset();
            }
        });
    };

    if (submitted) {
        return <SuccessBanner onReset={() => setSubmitted(false)} />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-[20px] w-full' noValidate>
            <div className='flex flex-col gap-3'>
                <label className='input-label'>Name:</label>
                <input
                    {...register('name')}
                    type='text'
                    placeholder='Enter name'
                    className='input-field'
                    disabled={isPending}
                />
                <FieldError message={errors.name?.message} />
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
                <FieldError message={errors.email?.message} />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Message:</label>
                <div className='relative w-full'>
                    <textarea
                        {...register('message')}
                        placeholder='Enter your message'
                        rows={4}
                        maxLength={MESSAGE_MAX}
                        className='input-field pt-4 min-h-[114px] resize-none'
                        disabled={isPending}
                    />
                    <span className='absolute bottom-4 right-4 text-[16px] font-medium text-dark/50'>
                        {messageLen}/{MESSAGE_MAX}
                    </span>
                </div>
                <FieldError message={errors.message?.message} />
            </div>

            <TermsCheckbox
                {...register('agreedToTerms')}
                error={errors.agreedToTerms?.message}
                disabled={isPending}
            />

            <FormSubmitButton className='mt-3 mx-auto' disabled={isPending}>
                {isPending ? 'Sending…' : 'Submit Inquiry'}
            </FormSubmitButton>
        </form>
    );
}

// ─── Host Partnership Form ────────────────────────────────────────────────────

function HostForm() {
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<HostFormData>({
        resolver: zodResolver(hostSchema),
        defaultValues: { agreedToTerms: undefined },
    });

    const contactLen = watch('contactInfo')?.length ?? 0;

    const onSubmit = (data: HostFormData) => {
        startTransition(async () => {
            const result = await submitHostInquiry(data);
            if ('error' in result) {
                toast.error(result.error);
            } else {
                setSubmitted(true);
                reset();
            }
        });
    };

    if (submitted) {
        return <SuccessBanner onReset={() => setSubmitted(false)} />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-[20px] w-full' noValidate>
            <div className='flex flex-col gap-3'>
                <label className='input-label'>Company Name:</label>
                <input
                    {...register('companyName')}
                    type='text'
                    placeholder='Enter company name'
                    className='input-field'
                    disabled={isPending}
                />
                <FieldError message={errors.companyName?.message} />
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
                <FieldError message={errors.location?.message} />
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
                <FieldError message={errors.parkingSpaces?.message} />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Contact Info:</label>
                <div className='relative w-full'>
                    <textarea
                        {...register('contactInfo')}
                        placeholder='Enter your contact info'
                        rows={4}
                        maxLength={MESSAGE_MAX}
                        className='input-field pt-4 min-h-[114px] resize-none'
                        disabled={isPending}
                    />
                    <span className='absolute bottom-4 right-4 text-[16px] font-medium text-dark/50'>
                        {contactLen}/{MESSAGE_MAX}
                    </span>
                </div>
                <FieldError message={errors.contactInfo?.message} />
            </div>

            <TermsCheckbox
                {...register('agreedToTerms')}
                error={errors.agreedToTerms?.message}
                disabled={isPending}
            />

            <FormSubmitButton className='mt-3 mx-auto' disabled={isPending}>
                {isPending ? 'Sending…' : 'Submit Inquiry'}
            </FormSubmitButton>
        </form>
    );
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className='text-[13px] text-error font-medium -mt-1'>{message}</p>;
}

import { forwardRef } from 'react';

const TermsCheckbox = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ error, disabled, ...props }, ref) => (
    <div className='flex flex-col gap-1.5'>
        <label className='flex items-center gap-2 cursor-pointer mt-2 group'>
            <div className='relative flex items-center justify-center w-4 h-4 shrink-0'>
                <input
                    {...props}
                    ref={ref}
                    type='checkbox'
                    disabled={disabled}
                    className='peer absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full disabled:cursor-not-allowed'
                />
                <CheckboxIcon className='absolute inset-0 pointer-events-none peer-checked:opacity-0 transition-opacity' />
                <div className='absolute inset-0 bg-primary rounded-[3.5px] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity flex items-center justify-center'>
                    <svg
                        className='w-[10px] h-[10px] text-white'
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
        <FieldError message={error} />
    </div>
));
TermsCheckbox.displayName = 'TermsCheckbox';

function SuccessBanner({ onReset }: { onReset: () => void }) {
    return (
        <div className='flex flex-col items-center gap-6 py-10 text-center animate-in fade-in slide-in-from-bottom-4'>
            <div className='w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center'>
                <svg
                    className='w-7 h-7 text-primary'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <polyline points='20 6 9 17 4 12' />
                </svg>
            </div>
            <div>
                <p className='text-[20px] font-semibold text-dark mb-1'>Inquiry sent!</p>
                <p className='text-[15px] text-dark/60 leading-relaxed'>
                    We&rsquo;ve received your message and will get back to you shortly.
                    <br />
                    Check your inbox for a confirmation email.
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
