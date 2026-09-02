import { FadeUp } from '@/components/ui/fade-up';
import { HomePageMobilityData, TextGridData } from '@/data';
import { cn } from '@/lib/utils';

export function TextGridSection({
    data = HomePageMobilityData,
    heading = 'Powering the Future of Mobility',
    titleClass = '',
}: {
    data?: TextGridData[];
    heading?: string;
    titleClass?: string;
}) {
    return (
        <section className='w-full max-w-[1444px] mx-auto overflow-x-hidden common-section-padding bg-background'>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark max-sm:w-[322px] mb-10'>
                        {heading}
                    </h2>
                </FadeUp>

                {/*
                 * Border strategy (all same specificity → lg always wins over md):
                 *  Mobile  (1-col): divide-y on parent
                 *  Tablet  (2-col): right border on left col, bottom border on row-1
                 *  Desktop (4-col): right border on all except last
                 */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full divide-y divide-dark/25 md:divide-y-0'>
                    {data.map((item, index) => {
                        const isLeftCol = index % 2 === 0;
                        const isFirstRow = index < 2;
                        const isLastItem = index === data.length - 1;

                        return (
                            <FadeUp
                                key={item.id}
                                delay={index * 0.1}
                                className={cn(
                                    'py-6 border-dark/25',

                                    // ── Tablet (md) 2×2 ──────────────────────────────
                                    // Left column → right border + right padding
                                    isLeftCol
                                        ? 'md:border-r md:pr-[53px]'
                                        : 'md:pl-[53px]',
                                    // First row → bottom border
                                    isFirstRow
                                        ? 'md:border-b md:pb-6'
                                        : 'md:pt-6',

                                    // ── Desktop (lg) 4-col ───────────────────────────
                                    // Reset tablet borders
                                    'lg:border-b-0 lg:pb-0 lg:pt-0 lg:border-r-0',
                                    // Right border on all except last
                                    !isLastItem && 'lg:border-r',
                                    // Padding: auto equal spacing (~27px each side = 54px total gap)
                                    'lg:px-[27px] first:lg:pl-0 last:lg:pr-0'
                                )}>
                                <h3
                                    className={cn(
                                        'headline-5 text-dark',
                                        titleClass
                                    )}>
                                    {item.title}
                                </h3>
                                {item.description && (
                                    <p className='mt-2 w-full text-dark md:text-dark/70 text-[16px] font-normal md:font-medium leading-[140%]'>
                                        {item.description}
                                    </p>
                                )}
                            </FadeUp>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

