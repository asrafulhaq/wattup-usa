import { HostPageTechnologyFeaturesData } from '@/data';
import { hostsImageUrls } from '@/lib/images/hosts';
import Image from 'next/image';

export function TechnologyBacked() {
    return (
        <section className='relative w-full bg-black overflow-hidden md:min-h-[900px] lg:min-h-[1100px] flex items-center'>
            {/* Desktop: background image */}
            <div className='absolute inset-0 hidden lg:block'>
                <Image
                    src={hostsImageUrls.technologyBackedForHost}
                    alt='Wattup Charging Hardware'
                    fill
                    className='object-cover object-right lg:object-contain lg:object-right'
                    priority
                />
            </div>

            {/* Vignette Overlay */}
            <div
                className='absolute inset-0 z-0 pointer-events-none hidden lg:block'
                style={{
                    background: `
                        linear-gradient(to right, black 0%, black 25%, transparent 60%, transparent 90%, black 100%),
                        linear-gradient(to bottom, black 0%, transparent 15%, transparent 85%, black 100%)
                    `,
                }}
            />

            {/* Content */}
            <div className='relative z-10 w-full max-w-[1440px] mx-auto px-5 lg:px-[112px] pt-[60px] md:pt-[100px] pb-[60px] md:pb-[150px]'>
                {/* Header */}
                <div className='flex flex-col items-center text-center md:mb-24'>
                    <h2 className='headline-white mb-4 md:mb-6 leading-[110%]'>
                        Technology Backed
                        <br />
                        by Global Innovation
                    </h2>
                    <p className='text-[16px] md:text-description font-normal text-white/60 w-full max-w-[348px] md:max-w-[600px]'>
                        Our charging infrastructure combines advanced hardware
                        with intelligent network management to deliver reliable,
                        high-performance EV charging.
                    </p>
                </div>

                <div className='flex flex-col md:flex-row'>
                    {/* Features list - Constrained on desktop to prevent overlap */}
                    <div className='flex flex-col w-full md:max-w-[60%] lg:max-w-[517px]'>
                        {/* Mobile-only inline image - High prominence */}
                        <div className='relative lg:hidden w-screen h-[500px] sm:h-[600px] md:h-[700px] -mx-5 mb-10 z-20'>
                            <Image
                                src={hostsImageUrls.technologyBackedForHostMobile}
                                alt='Wattup Charging Hardware'
                                fill
                                className='object-cover object-right'
                                priority
                            />
                            {/* Mobile Vignette - Strong blend */}
                            <div className='absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-100' />
                        </div>

                        {HostPageTechnologyFeaturesData.map(
                            (feature, index) => (
                                <div
                                    key={index}
                                    className='relative  w-[517px] flex flex-col gap-2 py-6 md:py-[47px]'>
                                    {/* Line - Full-width on mobile, constrained on desktop */}
                                    {index !== 0 && (
                                        <div className='absolute top-0 left-[-2000px] right-[-2000px] md:left-0 md:right-0 border-t border-white/20 z-10 pointer-events-none' />
                                    )}

                                    {/* Text Content */}
                                    <div className='relative z-30'>
                                        <h3 className='text-[24px] md:text-[36px] font-medium tracking-[-0.03em] leading-[110%] text-white flex flex-col gap-3'>
                                            <span className='text-white/70'>
                                                {feature.number}
                                            </span>
                                            <span className='whitespace-pre-line'>
                                                {feature.title}
                                            </span>
                                        </h3>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

