import { homeImageUrls } from '@/lib/images/home';
import Image from 'next/image';

export interface TechnologySlideProps {
    slideRef: (el: HTMLDivElement | null) => void;
    textRef: (el: HTMLDivElement | null) => void;
    style?: React.CSSProperties;
}

const vignetteStyle: React.CSSProperties = {
    boxShadow: 'inset 0 0 150px 60px rgba(0, 0, 0, 0.95)',
};

const mobileEdgeGradient: React.CSSProperties = {
    background:
        'linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 72%, #000 100%)',
};

/* ─────────────────────────────────────────────────────────
   Slide 1 — Smart charging infrastructure
───────────────────────────────────────────────────────── */
export function TechnologySlide1({
    slideRef,
    textRef,
    style,
}: TechnologySlideProps) {
    return (
        <div
            ref={slideRef}
            className='absolute inset-0 w-full max-md:flex max-md:flex-col will-change-transform'
            style={style}>
            {/* Mobile text */}
            <div ref={textRef} className='md:hidden shrink-0 px-4 pt-8 pb-5'>
                <div className='flex items-start gap-2'>
                    <span className='text-white/70 text-[24px] font-medium leading-[110%] shrink-0'>
                        01.
                    </span>
                    <div className='flex flex-col gap-3'>
                        <h3 className='text-[24px] text-white font-medium leading-[110%]'>
                            Smart charging infrastructure
                        </h3>
                        <p className='text-[16px] text-white/50 leading-[140%]'>
                            Lorem ipsum dolor sit amet consectetur
                        </p>
                    </div>
                </div>
            </div>

            {/* Image area */}
            <div className='md:absolute md:inset-0 max-md:relative max-md:h-100.75 max-md:w-95 max-md:overflow-hidden z-0'>
                <Image
                    src={homeImageUrls.technologyBacked1}
                    alt='Smart charging infrastructure'
                    fill
                    sizes='(max-width: 768px) 0vw, 100vw'
                    className='object-cover object-bottom hidden md:block'
                    priority
                />
                <Image
                    src={homeImageUrls.technologyBacked1Mobile}
                    alt='Smart charging infrastructure'
                    fill
                    sizes='(max-width: 768px) 100vw, 0vw'
                    className='object-cover  object-center md:hidden'
                    priority
                />

                <div
                    className='absolute max-md:hidden inset-0 z-1 pointer-events-none'
                    style={vignetteStyle}
                />
                {/* Desktop left-edge gradient */}
                <div
                    className='absolute z-5 pointer-events-none hidden md:block'
                    style={{
                        inset: 0,
                        right: 'auto',
                        width: '1444px',
                        background:
                            'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 58%, #000 100%)',
                    }}
                />
                {/* Mobile top+bottom edge gradient */}
                <div
                    className='absolute inset-0 z-5 pointer-events-none md:hidden'
                    style={mobileEdgeGradient}
                />

                {/* Desktop text */}
                <div className='hidden md:block absolute inset-0 z-10 pointer-events-none'>
                    <div
                        className='absolute pointer-events-auto'
                        style={{ left: '252px', top: '155px' }}>
                        <div className='flex items-start text-left'>
                            <h3 className='headline-3 text-white'>
                                <span className='text-white/70 mr-3'>01.</span>
                            </h3>
                            <div className='flex flex-col'>
                                {' '}
                                <h3 className='headline-3 text-white'>
                                    Smart charging
                                    <br />
                                    infrastructure
                                </h3>
                                <p className='text-description text-white/50 max-w-71'>
                                    Lorem ipsum dolor sit amet consectetur
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   Slide 2 — High-performance hardware
───────────────────────────────────────────────────────── */
export function TechnologySlide2({
    slideRef,
    textRef,
    style,
}: TechnologySlideProps) {
    return (
        <div
            ref={slideRef}
            className='absolute inset-0 w-full max-md:flex max-md:flex-col will-change-transform'
            style={style}>
            {/* Mobile text */}
            <div ref={textRef} className='md:hidden shrink-0 px-4 pt-8 pb-5'>
                <div className='flex items-start gap-2'>
                    <span className='text-white/70 text-[24px] font-medium leading-[110%] shrink-0'>
                        02.
                    </span>
                    <div className='flex flex-col gap-3'>
                        <h3 className='text-[24px] text-white font-medium leading-[110%]'>
                            High-performance hardware
                        </h3>
                        <p className='text-[16px] text-white/50 leading-[140%]'>
                            Lorem ipsum dolor sit amet consectetur
                        </p>
                    </div>
                </div>
            </div>

            {/* Image area */}
            <div className='md:absolute md:inset-0 max-md:relative  max-md:w-[380px] max-md:h-[366px] max-md:overflow-hidden z-0'>
                <Image
                    src={homeImageUrls.technologyBacked2}
                    alt='High-performance hardware'
                    fill
                    sizes='(max-width: 768px) 0vw, 100vw'
                    className='object-cover object-bottom max-lg:object-right hidden md:block'
                />
                <Image
                    src={homeImageUrls.technologyBacked2Mobile}
                    alt='High-performance hardware'
                    fill
                    sizes='(max-width: 768px) 100vw, 0vw'
                    className='object-scale-down scale-110 md:hidden'
                />

                <div
                    className='absolute max-md:hidden inset-0 z-1 pointer-events-none'
                    style={vignetteStyle}
                />
                {/* Mobile top+bottom edge gradient */}
                <div
                    className='absolute inset-0 z-5 pointer-events-none md:hidden'
                    style={mobileEdgeGradient}
                />

                {/* Desktop text */}
                <div className='hidden md:block absolute inset-0 z-10 pointer-events-none'>
                    <div
                        className='absolute pointer-events-auto'
                        style={{ left: '1079px', top: '328px' }}>
                        <div className='flex items-start text-left'>
                            <h3 className='headline-3 text-white'>
                                <span className='text-white/70 mr-3'>02.</span>
                            </h3>
                            <div className='flex flex-col'>
                                <h3 className='headline-3 text-white'>
                                    High-performance
                                    <br />
                                    hardware
                                </h3>
                                <p className='text-description text-white/50 max-w-71'>
                                    Lorem ipsum dolor sit amet consectetur
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────
   Slide 3 — Seamless payment integration
───────────────────────────────────────────────────────── */
export function TechnologySlide3({
    slideRef,
    textRef,
    style,
}: TechnologySlideProps) {
    return (
        <div
            ref={slideRef}
            className='absolute inset-0 w-full max-md:flex max-md:flex-col will-change-transform'
            style={style}>
            {/* Mobile text */}
            <div ref={textRef} className='md:hidden shrink-0 px-4 pt-8 pb-5'>
                <div className='flex items-start gap-2'>
                    <span className='text-white/70 text-[24px] font-medium leading-[110%] shrink-0'>
                        03.
                    </span>
                    <div className='flex flex-col gap-3'>
                        <h3 className='text-[24px] text-white font-medium leading-[110%]'>
                            Seamless payment integration
                        </h3>
                        <p className='text-[16px] text-white/50 leading-[140%]'>
                            Lorem ipsum dolor sit amet consectetur
                        </p>
                    </div>
                </div>
            </div>

            {/* Image area */}
            <div className='md:absolute md:inset-0 max-md:relative  max-md:h-114.25 max-md:w-[380px] max-md:overflow-hidden z-0'>
                <Image
                    src={homeImageUrls.technologyBacked3}
                    alt='Seamless payment integration'
                    fill
                    sizes='(max-width: 768px) 0vw, 100vw'
                    className='object-cover object-bottom hidden md:block'
                />
                <Image
                    src={homeImageUrls.technologyBacked3Mobile}
                    alt='Seamless payment integration'
                    fill
                    sizes='(max-width: 768px) 100vw, 0vw'
                    className='object-cover object-center md:hidden'
                />

                <div
                    className='absolute max-md:hidden inset-0 z-1 pointer-events-none'
                    style={vignetteStyle}
                />
                {/* Desktop left-edge gradient */}
                <div
                    className='absolute z-5 pointer-events-none hidden md:block'
                    style={{
                        inset: 0,
                        right: 'auto',
                        width: '699px',
                        background:
                            'linear-gradient(270deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 58%, #000 94.86%)',
                    }}
                />
                {/* Mobile top+bottom edge gradient */}
                <div
                    className='absolute inset-0 z-5 pointer-events-none md:hidden'
                    style={mobileEdgeGradient}
                />

                {/* Desktop text */}
                <div className='hidden md:block absolute inset-0 z-10 pointer-events-none'>
                    <div
                        className='absolute pointer-events-auto'
                        style={{ left: '152px', top: '304px' }}>
                        <div className='flex items-start text-left'>
                            <h3 className='headline-3 text-white'>
                                <span className='text-white/70 mr-3'>03.</span>
                            </h3>
                            <div className='flex flex-col'>
                                <h3 className='headline-3 text-white'>
                                    Seamless payment
                                    <br />
                                    integration
                                </h3>
                                <p className='text-description text-white/50 max-w-71'>
                                    Lorem ipsum dolor sit amet consectetur
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}







