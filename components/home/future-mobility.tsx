import { FadeUp } from '@/components/ui/fade-up';

const items = [
    { title: 'Fast Charging', id: 1 },
    { title: 'Premium Locations', id: 2 },
    { title: 'Smart Infrastructure', id: 3 },
    { title: 'Reliable Network', id: 4 },
];

export function FutureMobility() {
    return (
        <section className="w-full py-16 bg-background border-y border-gray-light">
            <div className="container">
                <FadeUp>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-dark mb-12">
                        Powering the Future of Mobility
                    </h2>
                </FadeUp>

                <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-light gap-y-8">
                    {items.map((item, index) => (
                        <FadeUp 
                            key={item.id} 
                            delay={index * 0.1} 
                            className="flex flex-col px-4 md:px-8 first:pl-0"
                        >
                            <h3 className="text-xl md:text-2xl font-bold text-dark max-w-[150px] leading-tight">
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
