'use client';

import { CheckboxIcon } from '@/components/icons/icons';
import { useState } from 'react';
const ContactFormCentered = () => {
    const [activeTab, setActiveTab] = useState<'driver' | 'host'>('driver');

    return (
        <section
            id='contact-form'
            className='bg-white pt-12 md:pt-20 pb-12 md:pb-20'>
            <div className='container mx-auto px-4 text-center'>
                <h2 className='headline-dark mb-6'>
                    Still need help?
                    <br />
                    Contact us directly
                </h2>
            </div>

            <div className='flex mx-auto flex-col w-full max-w-[555px] lg:mx-auto'>
                {/* Tab Switcher */}
                <div className='relative mx-auto flex bg-gray/30 rounded-[8px] p-1 w-fit mb-10'>
                    {/* Sliding Background Indicator */}
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
                        className={`relative z-10 px-[20px] py-[12px] rounded-[8px] text-[16px]  transition-colors duration-500 ${
                            activeTab === 'driver'
                                ? 'text-white font-bold'
                                : 'text-dark/50 font-medium hover:text-dark'
                        }`}>
                        Driver Support
                    </button>
                    <button
                        onClick={() => setActiveTab('host')}
                        className={`relative z-10 px-[20px] py-[12px] rounded-[8px] text-[16px]  transition-colors duration-500 ${
                            activeTab === 'host'
                                ? 'text-white font-bold'
                                : 'text-dark/50 font-medium hover:text-dark'
                        }`}>
                        Host Partnership
                    </button>
                </div>

                {/* Forms rendered based on state with a simple transition wrapper */}
                <div className='relative overflow-hidden'>
                    <div
                        key={activeTab}
                        className='transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4'>
                        {activeTab === 'driver' ? <DriverForm /> : <HostForm />}
                    </div>
                </div>
            </div>
        </section>
    );
};

function DriverForm() {
    return (
        <form className='flex flex-col gap-[20px] w-full'>
            <div className='flex flex-col gap-3'>
                <label className='input-label'>Name:</label>
                <input
                    type='text'
                    placeholder='Enter name'
                    className='input-field'
                />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Email:</label>
                <input
                    type='email'
                    placeholder='Enter email'
                    className='input-field'
                />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Message:</label>
                <div className='relative w-full'>
                    <textarea
                        placeholder='Enter your text'
                        rows={4}
                        className='input-field pt-4 min-h-[114px] resize-none'
                    />
                    <span className='absolute bottom-4 right-4 text-[16px] font-medium text-dark/50'>
                        0/70
                    </span>
                </div>
            </div>

            <label className='flex items-center gap-2 cursor-pointer mt-2 group'>
                <div className='relative flex items-center justify-center w-4 h-4 shrink-0'>
                    <input
                        type='checkbox'
                        className='peer absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full'
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

            <button
                type='submit'
                className='mt-3 px-[28px] mx-auto py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] self-start leading-[130%] transition-all duration-500'>
                Submit Inquiry
            </button>
        </form>
    );
}

function HostForm() {
    return (
        <form className='flex flex-col gap-[20px] w-full'>
            <div className='flex flex-col gap-3'>
                <label className='input-label'>Company Name:</label>
                <input
                    type='text'
                    placeholder='Enter company name'
                    className='input-field'
                />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Location:</label>
                <input
                    type='text'
                    placeholder='Enter location'
                    className='input-field'
                />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Number of Parking Spaces:</label>
                <input
                    type='text'
                    placeholder='Enter number of parking spaces'
                    className='input-field'
                />
            </div>

            <div className='flex flex-col gap-2'>
                <label className='input-label'>Contact Info:</label>
                <div className='relative w-full'>
                    <textarea
                        placeholder='Enter your contact info'
                        rows={4}
                        className='input-field pt-4 min-h-[114px] resize-none'
                    />
                    <span className='absolute bottom-4 right-4 text-[16px] font-medium text-dark/50'>
                        0/70
                    </span>
                </div>
            </div>

            <label className='flex items-center gap-2 cursor-pointer mt-2 group'>
                <div className='relative flex items-center justify-center w-4 h-4 shrink-0'>
                    <input
                        type='checkbox'
                        className='peer absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full'
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

            <button
                type='submit'
                className='mt-3 mx-auto px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] self-start leading-[130%] transition-all duration-500'>
                Submit Inquiry
            </button>
        </form>
    );
}

export default ContactFormCentered;

