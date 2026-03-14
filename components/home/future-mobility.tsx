import { FadeUp } from '@/components/ui/fade-up';

const items = [
    { title: 'Fast Charging', id: 1 },
    { title: 'Premium Locations', id: 2 },
    { title: 'Smart Infrastructure', id: 3 },
    { title: 'Reliable Network', id: 4 },
];

export function FutureMobility() {
    return (
        <section className='w-full common-section-padding bg-background '>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        Powering the Future of Mobility
                    </h2>
                </FadeUp>

                <div className='grid grid-cols-2 lg:grid-cols-4  gap-y-8'>
                    {items.map((item, index) => (
                        <FadeUp
                            key={item.id}
                            delay={index * 0.1}
                            className='flex flex-col px-[53px] py-3 border-r border-gray last:border-r-0 first:pl-0'>
                            <h3 className='headline-5 text-dark max-w-[258px]'>
                                {item.title.split(' ')[0]}
                                <br />
                                {item.title.split(' ')[1]}
                            </h3>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}

