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
        id: 'fast-charging',
        image: '/assets/images/why-image-1.png',
        title: 'Fast Charging',
        description:
            'High-performance charging stations designed for speed and reliability.',
        cta: { label: 'Find Charging Locations', href: '/find-charger' },
    },
    {
        id: 'premium-locations',
        image: '/assets/images/why-image-2.png',
        title: 'Premium Locations',
        description:
            'Charge where you already spend your time — shopping centers, hotels, and workplaces.',
        cta: { label: 'Find Charging Locations', href: '/find-charger' },
    },
    {
        id: 'smart-infrastructure',
        image: '/assets/images/hero-driver.jpg',
        title: 'Smart Infrastructure',
        description:
            'Built with advanced technology and monitored for maximum uptime.',
        cta: { label: 'Find Charging Locations', href: '/find-charger' },
    },
];

export function WhyChoose() {
    return (
        <section className='w-full max-w-[1440px] mx-auto  overflow-x-hidden common-section-padding bg-background overflow-hidden relative'>
            <div className='container mx-auto '>
                <FadeUp>
                    <h2 className='headline-dark mb-10'>Why Choose WattUp</h2>
                </FadeUp>

                <FadeUp delay={0.1}>
                    <CardSliderWrapper cards={slidesCardData} />
                </FadeUp>
            </div>
        </section>
    );
}

