'use client';

import Link from 'next/link';
import { useState } from 'react';

export function ContactForm() {
    const [activeTab, setActiveTab] = useState<'driver' | 'host'>('driver');

    return (
        <section className='relative w-full bg-white flex flex-col items-center justify-center overflow-hidden common-section-padding'>
            <div className='relative w-full container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-0'>
                {/* Left Column: Contact Details */}
                <div className='flex flex-col gap-10'>
                    <h2 className='headline-dark'>Contact details:</h2>

                    <div className='flex flex-col gap-10'>
                        <div className='flex flex-col gap-2'>
                            <p className='text-[16px] xl:text-[20px] leading-[120%] text-dark/50 font-normal'>
                                Email:
                            </p>
                            <Link
                                href='mailto:support@wattup.com'
                                className='text-[20px] md:text-[24px] font-medium leading-[100%] tracking-[-3%] text-dark border-b-2 border-transparent hover:border-dark transition-colors self-start'>
                                support@wattup.com
                            </Link>
                        </div>

                        <div className='flex flex-col gap-2'>
                            <p className='text-[16px] xl:text-[20px] leading-[120%] text-dark/50 font-normal'>
                                Partnership inquiries:
                            </p>
                            <Link
                                href='mailto:partners@wattup.com'
                                className='text-[20px] md:text-[24px] font-medium leading-[100%] tracking-[-3%] text-dark border-b-2 border-transparent hover:border-dark transition-colors self-start'>
                                partners@wattup.com
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className='flex flex-col w-full max-w-[555px] lg:mx-auto'>
                    <h2 className='headline-dark mb-6'>Leave your contacts</h2>

                    {/* Tab Switcher */}
                    <div className='relative flex bg-gray/30 rounded-[8px] p-1 w-fit mb-10'>
                        {/* Sliding Background Indicator */}
                        <div
                            className='absolute top-1 bottom-1 left-1 z-0 bg-black rounded-[8px] transition-all duration-300 ease-in-out shadow-sm'
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
                            className={`relative z-10 px-[20px] py-[12px] rounded-[8px] text-[16px]  transition-colors duration-300 ${
                                activeTab === 'driver'
                                    ? 'text-white font-bold'
                                    : 'text-dark/50 font-medium hover:text-dark'
                            }`}>
                            Driver Support
                        </button>
                        <button
                            onClick={() => setActiveTab('host')}
                            className={`relative z-10 px-[20px] py-[12px] rounded-[8px] text-[16px]  transition-colors duration-300 ${
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
                            {activeTab === 'driver' ? (
                                <DriverForm />
                            ) : (
                                <HostForm />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

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

            <label className='flex items-center gap-3 cursor-pointer mt-2 group'>
                <div className='relative flex items-center justify-center w-5 h-5 shrink-0'>
                    <input
                        type='checkbox'
                        className='peer h-full w-full appearance-none rounded-[4px] border border-dark/20 bg-white checked:bg-primary checked:border-primary cursor-pointer transition-all'
                    />
                    <svg
                        className='absolute w-3  h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity'
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
                <span className='text-[16px] text-dark group-hover:text-dark/80 font-medium'>
                    I agree to the processing of my personal data
                </span>
            </label>

            <button
                type='submit'
                className='mt-3 px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] self-start leading-[130%] transition-all duration-300'>
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

            <label className='flex items-center gap-3 cursor-pointer mt-2 group'>
                <div className='relative flex items-center justify-center w-5 h-5 shrink-0'>
                    <input
                        type='checkbox'
                        className='peer h-full w-full appearance-none rounded-[4px] border border-dark/20 bg-white checked:bg-primary checked:border-primary cursor-pointer transition-all'
                    />
                    <svg
                        className='absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity'
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
                <span className='text-[16px] text-dark group-hover:text-dark/80 font-medium'>
                    I agree to the processing of my personal data
                </span>
            </label>

            <button
                type='submit'
                className='mt-3 px-[28px] py-[16px] bg-primary hover:bg-primary-hover text-white rounded-[8px] font-bold text-[16px] self-start leading-[130%] transition-all duration-300'>
                Submit Inquiry
            </button>
        </form>
    );
}


