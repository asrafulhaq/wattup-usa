'use client';

export function VideoPresentation() {
    return (
        <section className='relative common-section-padding mx-auto w-full h-[600px] md:h-[809px] bg-black overflow-hidden flex items-center justify-center'>
            {/* Background Video */}
            <div className='absolute container mx-auto overflow-hidden inset-0 z-0'>
                <video
                    className='w-full h-full object-cover opacity-60'
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster='/assets/images/home/hero-2.png'>
                    <source src='/assets/videos/video-1.mp4' type='video/mp4' />
                </video>
            </div>
        </section>
    );
}

