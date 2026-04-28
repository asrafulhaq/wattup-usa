'use client';

import { CheckboxIcon } from '@/components/icons/icons';
import { FormSubmitButton } from '@/components/ui/wattup-button';
import { FadeUp } from '../ui/fade-up';

export function AccessRequest() {
    return (
        <section
            id='access-request'
            className='relative w-full bg-white common-section-padding'>
            <div className='relative w-full container mx-auto'>
                <div className='flex flex-col justify-center  w-full max-w-[555px] lg:mx-auto'>
                    <FadeUp>
                        <h2 className='headline-dark text-center mb-10'>
                            Access Request
                        </h2>
                    </FadeUp>

                    {/* Forms rendered based on state with a simple transition wrapper */}
                    <FadeUp delay={0.2} className='relative overflow-hidden'>
                        <div className='relative overflow-hidden'>
                            <div className='transition-all duration-500 ease-in-out animate-in fade-in max-md:px-4 slide-in-from-bottom-4'>
                                <AccessForm />
                            </div>
                        </div>
                    </FadeUp>
                </div>
            </div>
        </section>
    );
}

function AccessForm() {
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
                <label className='input-label'>Company/Fund:</label>
                <input
                    type='text'
                    placeholder='Enter company/fund'
                    className='input-field'
                />
            </div>
            <div className='flex flex-col gap-2'>
                <label className='input-label'>Investment Focus:</label>
                <input
                    type='text'
                    placeholder='Enter investment focus'
                    className='input-field'
                />
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

            <FormSubmitButton className='mt-3'>Request Access</FormSubmitButton>
        </form>
    );
}

