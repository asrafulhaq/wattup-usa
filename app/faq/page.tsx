import { PageHero } from '@/components/drivers/page-hero';
import { faqImageUrls } from '@/lib/images/faq';

import { FAQSection } from '@/components/drivers/faq';
import { CTAReady } from '@/components/home/cta-ready';
import { faqPageFaqData } from '@/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FAQ | WattUp EV Charging',
    description: 'Frequently asked questions about WattUp EV charging network.',
    openGraph: {
        title: 'FAQ | WattUp EV Charging',
        description:
            'Frequently asked questions about WattUp EV charging network.',
        images: [
            {
                url: faqImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'FAQ | WattUp EV Charging',
        description:
            'Frequently asked questions about WattUp EV charging network.',
        images: [
            {
                url: faqImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattUp USA EV Charging',
            },
        ],
    },
};

export default function FAQPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                sectionClass='max-md:h-[710px] md:h-[810px]! '
                overlay={true}
                imageClass='object-cover object-[25%_bottom]'
                image={faqImageUrls.heroImage}
                mobileImage={faqImageUrls.heroImageMobile}
                heading={
                    <>
                        Find out the answers <br /> to all your questions
                    </>
                }
                subHeading={'Find out the answers to all your questions'}
                buttonText='Find a Charger'
                buttonLink='#'
                buttonLight={true}
                buttonClass='max-md:bg-primary max-md:hover:bg-primary-hover max-md:text-white'
            />

            {/* 2. FAQ */}
            <FAQSection
                description={`If you don't  find the answer to your question here, just write to us.`}
                sectionClass=' w-[348px] md:w-[710px] mx-auto'
                faqs={faqPageFaqData}
            />

            {/* 3. CTA Section */}
            <CTAReady
                sectionClass='xl:h-[1080px]'
                image={faqImageUrls.ctaImage}
                mobileImage={faqImageUrls.ctaImageMobile}
                heading='Partner With Us'
                subHeading='Explore the WattUp charging network.'
                buttonText='Request Assessment'
                buttonLink='/contact#contact-us'
            />
        </main>
    );
}

