import { PressReleaseArchiveData } from '@/data';
import Image from 'next/image';
import { FadeUp } from '../ui/fade-up';

const PressReleaseDetails = ({
    pressRelease,
}: {
    pressRelease: PressReleaseArchiveData;
}) => {
    return (
        <article className='w-full common-section-padding bg-background'>
            <div className='mx-auto flex flex-col items-center'>
                {/* Hero Image */}
                {pressRelease?.image && (
                    <FadeUp className='w-full max-w-[1360px] h-[293px] sm:h-[400px] md:h-[560px] relative md:rounded-[12px] overflow-hidden mb-[40px] mx-[-110px]! md:mx-0 shrink-0'>
                        <Image
                            src={pressRelease.image}
                            alt={pressRelease.title || 'Press Release Image'}
                            fill
                            className='object-cover'
                        />
                    </FadeUp>
                )}

                {/* Main Content Block 1 */}
                <div className='container max-md:px-4 items-center  w-full max-w-[700px] text-description leading-[140%]! traking-[0%]! font-normal! flex flex-col gap-[32px] md:gap-[56px] text-dark'>
                    <FadeUp>
                        <p className=''>
                            We are excited to announce a major milestone in our
                            company&apos;s growth — the expansion of our
                            electric vehicle charging solutions into new
                            regional markets. This strategic move marks an
                            important step toward making EV infrastructure more
                            accessible, reliable, and scalable across a broader
                            geographic landscape.
                        </p>
                    </FadeUp>

                    <FadeUp className='flex flex-col gap-4'>
                        <h2 className='text-[20px] md:text-[24px] font-semibold text-dark leading-[130%] tracking-[-0.02em]'>
                            As demand for electric vehicles continues to rise.
                        </h2>
                        <p className=''>
                            The need for well-developed charging networks
                            becomes increasingly critical. By entering new
                            regions, we aim to address infrastructure gaps and
                            support both urban and rural communities in their
                            transition to sustainable transportation. Our
                            expansion focuses not only on increasing the number
                            of charging points but also on ensuring their
                            optimal placement, performance, and long-term
                            reliability.
                        </p>
                    </FadeUp>

                    <FadeUp>
                        <p className=''>
                            In each new market, we work closely with local
                            partners, municipalities, and businesses to develop
                            tailored solutions that meet specific regulatory,
                            technical, and environmental requirements. This
                            collaborative approach allows us to integrate
                            seamlessly into existing energy ecosystems while
                            delivering high-quality, future-proof charging
                            infrastructure.
                        </p>
                    </FadeUp>
                </div>

                {/* Second Image (if available) */}
                {pressRelease?.secondImage && (
                    <FadeUp className='w-full max-w-[1360px] h-[293px] sm:h-[400px] md:h-[560px] relative md:rounded-[12px] overflow-hidden my-[40px] shrink-0'>
                        <Image
                            src={pressRelease.secondImage}
                            alt={`${pressRelease.title || 'Press Release'} secondary image`}
                            fill
                            className='object-cover'
                        />
                    </FadeUp>
                )}

                {/* Main Content Block 2 */}
                <div className='container max-md:px-4 w-full max-w-[700px] text-description leading-[140%]! traking-[0%]! font-normal! flex flex-col gap-[32px] md:gap-[56px] text-dark'>
                    <FadeUp>
                        <p className=''>
                            Our rollout includes a diverse range of charging
                            options, from fast-charging stations for
                            high-traffic areas to more flexible solutions for
                            residential and workplace environments. All
                            installations are supported by our advanced
                            management systems, enabling real-time monitoring,
                            efficient energy usage, and a smooth user experience
                            for EV drivers.
                        </p>
                    </FadeUp>

                    <FadeUp className='flex flex-col gap-4'>
                        <h2 className='text-[20px] md:text-[24px] font-semibold text-dark leading-[130%] tracking-[-0.02em]'>
                            Looking ahead, we plan to continue scaling our
                            presence internationally.
                        </h2>
                        <p className=''>
                            This expansion also reflects our long-term
                            commitment to sustainability. Wherever possible, we
                            incorporate renewable energy sources and smart grid
                            technologies to reduce environmental impact and
                            promote clean energy usage.
                        </p>
                    </FadeUp>
                </div>
            </div>
        </article>
    );
};

export default PressReleaseDetails;






