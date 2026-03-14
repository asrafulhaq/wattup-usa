import { FadeUp } from '@/components/ui/fade-up';
import { CardSliderWrapper } from './built-for-slider';

export interface BuiltForCardData {
    id: string;
    image: string;
    title: string;
    description: string;
    cta: { label: string; href: string };
}

const builtForCards: BuiltForCardData[] = [
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
        id: 'partners',
        image: '/assets/images/car-4.png',
        title: 'For Partners',
        description:
            'Partner with WattUp and grow your business with premium EV infrastructure.',
        cta: { label: 'Learn More', href: '/partners' },
    },
    {
        id: 'fleets',
        image: '/assets/images/car-5.png',
        title: 'For Fleets',
        description:
            'Reliable, high-speed charging solutions designed for fleet operations.',
        cta: { label: 'Fleet Solutions', href: '/fleets' },
    },
];

export function BuiltFor() {
    return (
        <section className='w-full common-section-padding bg-background overflow-hidden relative'>
            <div className='container'>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>
                        Built for Drivers and Property Owners
                    </h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <CardSliderWrapper cards={builtForCards} />
                </FadeUp>
            </div>
        </section>
    );
}

