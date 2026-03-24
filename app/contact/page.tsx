import { PageHero } from '@/components/drivers/page-hero';

import { ContactForm } from '@/components/contact/contact-form';
import { CTAReady } from '@/components/home/cta-ready';
import type { Metadata } from 'next';
import { baseUrl } from '../page';

export const metadata: Metadata = {
    title: 'Contact Us | WattUp EV Charging',
    description:
        'Get in touch with the WattUp team for support, partnerships, or general inquiries about our EV charging network.',
        openGraph: {
            title: 'Contact Us | WattUp EV Charging',
            description:
                'Get in touch with the WattUp team for support, partnerships, or general inquiries about our EV charging network.',
            images: [
                {
                    url: `${baseUrl}/assets/images/contact/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: 'WattUp USA EV Charging',
                },
            ],
        },
        twitter: {
            title: 'Contact Us | WattUp EV Charging',
            description:
                'Get in touch with the WattUp team for support, partnerships, or general inquiries about our EV charging network.',
            images: [
                {
                    url: `${baseUrl}/assets/images/contact/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: 'WattUp USA EV Charging',
                },
            ],
        },
};

export default function ContactUsPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                sectionClass=''
                headingClass=''
                subHeadingClass='max-md:w-[306px] max-md:leading-[110%]'
                overlay={true}
                overlayClass=''
                image='/assets/images/contact/contact-page-hero.png'
                imageClass='object-cover object-[65%_bottom] max-md:scale-125  md:object-center'
                heading='Get in Touch'
                subHeading={
                    <>
                        Contact our team for support,
                        <br className='hidden md:block' />
                        partnerships, or general inquiries.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='#'
            />

            {/* 2. Contact Form */}
            <ContactForm />

            {/* 3. CTA Section */}
            <CTAReady
                sectionClass='xl:h-[1080px]'
                image='/assets/images/contact/contact-page-cta-image.png'
                imageClass='max-md:object-[40%_70%] xl:object-bottom'
                heading={
                    <>
                        Interested in hosting EV
                        <br className='hidden sm:block' />
                        charging?
                    </>
                }
                subHeading={
                    <>
                        Partner with WattUp to bring charging
                        <br className='hidden sm:block' />
                        to your property.
                    </>
                }
                buttonText='Become a Host'
                buttonLink='/contact#contact-us'
            />
        </main>
    );
}

