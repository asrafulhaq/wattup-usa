import { FadeUp } from '@/components/ui/fade-up';
import { CapitalPartnersTractionData } from '@/data';

export function TractionSnapshot() {
    return (
        <section className='w-full common-section-padding bg-white!'>
            <div className='container mx-auto'>
                {/* Heading */}
                <FadeUp>
                    <h2 className='headline-dark mb-[40px]'>
                        Traction Snapshot
                    </h2>
                </FadeUp>

                {/* Stats row — horizontal on ≥md, vertical stack on mobile */}
                {/* divide-y (mobile): horizontal separator between stacked rows     */}
                {/* divide-x (desktop): vertical separator between columns            */}
                <div className='grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 divide-dark/25 md:divide-x md:divide-dark/25'>
                    {CapitalPartnersTractionData.map((stat, index) => (
                        <FadeUp
                            key={stat.label}
                            delay={index * 0.15}
                            className='py-8 first:pt-0 last:pb-0 md:py-0 md:px-[58px] md:first:pl-0 md:last:pr-0'>
                            <div className='flex flex-col gap-1'>
                                <p className='text-[56px] font-bold leading-[110%] tracking-[-0.03em] text-dark'>
                                    {stat.value}
                                </p>
                                <p className='text-[20px] font-medium leading-[130%] text-dark'>
                                    {stat.label}
                                </p>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

