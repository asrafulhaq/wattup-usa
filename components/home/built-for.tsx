import { FadeUp } from '@/components/ui/fade-up';
import { CardSliderWrapper } from './built-for-slider';

export interface SlidesCardData {
    id: string;
    image: string;
    title: string;
    description: string;
    cta: { label: string; href: string };
}

const slidesCardData: SlidesCardData[] = [
    {
        id: 'drivers',
        image: '/assets/images/car1.png',
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Find Charging Locations', href: '/find-charger' },
    },
    {
        id: 'hosts',
        image: '/assets/images/car-2.png',
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/host' },
    },
    {
        id: 'drivers-1',
        image: '/assets/images/car1.png',
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Find Charging Locations', href: '/find-charger' },
    },
    {
        id: 'hosts-1',
        image: '/assets/images/car-2.png',
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/host' },
    },
];

export function BuiltFor() {
    return (
        <section className='w-full max-w-[1440px] mx-auto overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        Built for Drivers and Property Owners
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <CardSliderWrapper cards={slidesCardData} />
                </FadeUp>
            </div>
        </section>
    );
}

