import { HostPageTechnologyFeaturesData } from '@/data';
import Image from 'next/image';

export function TechnologyBacked() {
    return (
        <section className='relative w-full mx-auto bg-black flex flex-col items-center justify-center overflow-hidden pt-[82px]'>
            <div className='container mx-auto overflow-x-hidden'>
                {/* Header section */}
                <div className='relative z-30 flex flex-col items-center text-center w-full px-5'>
                    <h2 className='headline-white mb-6'>
                        Technology Backed
                        <br />
                        by Global Innovation
                    </h2>
                    <p className='text-description text-white/60 max-w-[446px] mb-20'>
                        Advanced hardware combined with intelligent charging
                        infrastructure.
                    </p>
                </div>
            </div>
            {/* Main Content Area */}
            <div className='relative w-full max-w-[1440px] mx-auto h-[756px] flex flex-col items-center justify-center lg:px-[100px]'>
                {/* Background Gradient Effect - placed here so it goes behind text & image */}
                <div
                    className='absolute z-0 pointer-events-none'
                    style={{
                        left: '0px',
                        top: '100px',
                        width: '800px',
                        height: '600px',
                        background:
                            'radial-gradient(50% 50% at 30% 50%, rgba(55, 48, 32, 0.85) 0%, rgba(55, 48, 32, 0) 100%)',
                        filter: 'blur(150px)',
                    }}
                />

                {/* Left side: Features List with Full Width Borders */}
                <div className='relative z-10 flex flex-col w-full border-t border-white/20'>
                    {HostPageTechnologyFeaturesData.map((feature, index) => (
                        <div
                            key={index}
                            className={`flex flex-col gap-[8px] py-[40px] pl-5 lg:pl-0 ${
                                index ===
                                HostPageTechnologyFeaturesData.length - 1
                                    ? ''
                                    : 'border-b border-white/20'
                            }`}>
                            <h3 className='headline-3 text-white whitespace-pre-line'>
                                <span className='text-white/70 mr-[12px]'>
                                    {feature.number}
                                </span>
                                {feature.title}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* Right side: Hardware Image Overlaying Borders */}
                <div className='absolute z-20 top-0 right-0 h-[756px] w-[600px] lg:w-[1080px] pointer-events-none'>
                    {/* Top gradient blur to blend image smoothly */}
                    <div className='absolute top-0 left-0 right-0 h-[80px] bg-linear-to-b from-black to-transparent z-30' />

                    {/* Bottom gradient blur to blend image smoothly */}
                    <div className='absolute bottom-0 left-0 right-0 h-[150px] bg-linear-to-t from-black to-transparent z-30' />

                    <div className='relative w-full h-full'>
                        <Image
                            src='/assets/images/technology-backed-for-host.png'
                            alt='Wattup Charging Hardware'
                            fill
                            className='object-cover object-left'
                            priority
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

