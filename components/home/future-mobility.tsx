import { FadeUp } from '@/components/ui/fade-up';

const items = [
    { title: 'Fast Charging', id: 1 },
    { title: 'Premium Locations', id: 2 },
    { title: 'Smart Infrastructure', id: 3 },
    { title: 'Reliable Network', id: 4 },
];

export function FutureMobility() {
    return (
        <section className='w-full max-w-[1444px] mx-auto overflow-x-hidden common-section-padding bg-background '>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark max-md:w-[322px] mb-10'>
                        Powering the Future of Mobility
                    </h2>
                </FadeUp>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-4 md:gap-y-8 w-fit text-left'>
                    {items.map((item, index) => {
                        // At md (2-col): items 0,2 get border-r; items 1,3 don't.
                        // At md (2-col): items 0,2 are row-starts — item 2 needs pl-0 (not pl-[53px]).
                        // At lg (4-col): all except last get border-r; only first gets pl-0 (first:pl-0 already handles it).
                        const isEvenIndex = index % 2 === 0; // 0,2 → left column at md
                        const isOddIndex = index % 2 === 1; // 1,3 → right column at md (no border)
                        const isSecondRowStart = index === 2; // first of second row at md → pl-0

                        return (
                            <FadeUp
                                key={item.id}
                                delay={index * 0.1}
                                className={[
                                    'flex flex-col items-start border-b pb-4 md:py-3',
                                    'pl-0 border-gray',
                                    isEvenIndex
                                        ? 'md:pl-0 md:pr-[53px]'
                                        : 'md:pl-[53px] md:pr-[53px]',
                                    isEvenIndex
                                        ? 'md:border-r'
                                        : 'md:border-r-0',
                                    'lg:pl-[53px] first:lg:pl-0',
                                    index === items.length - 1
                                        ? 'lg:border-r-0 max-md:border-b-0'
                                        : 'lg:border-r',
                                    'md:border-b-0',
                                    isSecondRowStart ? 'md:border-b-0' : '',
                                    isOddIndex && index === items.length - 1
                                        ? 'max-md:border-b-0'
                                        : '',
                                ].join(' ')}>
                                <h3 className='headline-5 text-dark w-[217px] md:w-[258px]'>
                                    {item.title.split(' ')[0]}
                                    <br className='hidden md:block' />
                                    {item.title.split(' ')[1]}
                                </h3>
                            </FadeUp>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

