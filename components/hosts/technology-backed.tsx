import { HostPageTechnologyFeaturesData } from '@/data';
import Image from 'next/image';

export function TechnologyBacked() {
    return (
        <section className='relative w-full  mx-auto bg-black flex flex-col items-center justify-center overflow-hidden py-[40px] md:pt-[82px]'>
            <div className='container mx-auto overflow-x-hidden'>
                {/* Header section */}
                <div className='relative z-30 flex flex-col items-center text-center w-full px-5'>
                    <h2 className='headline-white mb-4 md:mb-6 leading-[110%]'>
                        Technology Backed
                        <br />
                        by Global Innovation
                    </h2>
                    <p className='text-[16px] md:text-description font-normal text-white/60 w-[348px] md:w-[446px] mb-8 md:mb-20'>
                        Our charging infrastructure combines advanced hardware
                        with intelligent network management to deliver reliable,
                        high-performance EV charging.
                    </p>
                </div>
            </div>
            {/* Main Content Area */}
            {/* Main Content Area */}
            <div className='relative w-full max-w-[1440px] mx-auto h-auto md:h-[756px] flex flex-col items-center justify-center lg:px-[100px]'>
                {/* Background Gradient Effect - placed here so it goes behind text & image */}
                <div
                    className='absolute max-md:hidden z-0 pointer-events-none'
                    style={{
                        left: '150px',
                        top: '100px',
                        width: '800px',
                        height: '600px',
                        background:
                            'radial-gradient(50% 50% at 30% 50%, rgba(55, 48, 32, 0.85) 20%, rgba(55, 48, 32, 0) 100%)',
                        filter: 'blur(150px)',
                    }}
                />

                {/* Hardware Image (Top on Mobile, Right Overlay on Desktop) */}
                <div className='relative md:absolute max-md:z-0 md:z-20 top-0 max-md:left-[-20px] md:right-0 h-[455px] md:h-[756px] w-[617px] md:w-[600px] lg:w-[1080px] max-w-none pointer-events-none -mt-4 md:mt-0'>
                    {/* Top gradient blur to blend image smoothly */}
                    <div className='absolute top-0 left-0 right-0 h-[60px] md:h-[120px] bg-linear-to-b from-black to-transparent z-30' />

                    {/* Bottom gradient blur to blend image smoothly */}
                    <div className='absolute bottom-0 left-0 right-0 h-[150px] md:h-[350px] bg-linear-to-t from-black to-transparent z-30' />

                    <div className='relative w-[617px] md:w-full h-[450px] md:h-full'>
                        <Image
                            src='/assets/images/technology-backed-for-host.png'
                            alt='Wattup Charging Hardware'
                            fill
                            className='object-cover object-right md:object-left '
                            priority
                        />
                    </div>
                </div>

                {/* Left side: Features List with Full Width Borders */}
                <div className='relative z-10 flex flex-col w-full max-md:-mt-[37px] md:mt-0'>
                    {HostPageTechnologyFeaturesData.map((feature, index) => (
                        <div
                            key={index}
                            className={`flex flex-col gap-[8px] py-[20px] md:py-[40px] pl-5 lg:pl-0 ${
                                index === 0 ? '' : 'border-t border-white/20'
                            }`}>
                            <h3 className='max-md:w-[348px] text-[24px] md:text-[36px] max-md:text-nowrap font-medium tracking-[-3%] leading-[110%] text-white md:whitespace-pre-line flex flex-col gap-[12px]'>
                                <span className='md:text-white/70'>
                                    {feature.number}
                                </span>
                                <span className='max-md:text-nowrap'>
                                    {feature.title}
                                </span>
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

