import { PageHero } from '@/components/drivers/page-hero';
import { contactImageUrls } from '@/lib/images/contact';

import ContactFormCentered from '@/components/contact/contact-form-centered';
import { ContactInfo } from '@/components/contact/contact-info';
import { HowCanWeHelp } from '@/components/contact/how-can-we-help';
import { CTAReady } from '@/components/home/cta-ready';
import type { Metadata } from 'next';

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
                url: contactImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattupUSA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'Contact Us | WattUp EV Charging',
        description:
            'Get in touch with the WattUp team for support, partnerships, or general inquiries about our EV charging network.',
        images: [
            {
                url: contactImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattupUSA EV Charging',
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
                image={contactImageUrls.contactPageHero}
                mobileImage={contactImageUrls.contactPageHeroMobile}
                imageClass='object-cover  md:object-center'
                heading='Get in Touch'
                subHeading={
                    <>
                        Contact our team for support,
                        <br className='hidden md:block' />
                        partnerships, or general inquiries.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='/locations#locations'
            />

            {/* 3. How Can We Help (FAQ) */}
            <HowCanWeHelp />

            {/* 4. Contact Info */}
            <ContactInfo />

            {/* 5. Contact Form Section */}

            <ContactFormCentered />

            {/* 6. CTA Section */}
            <CTAReady
                sectionClass='xl:h-[1080px]'
                image={contactImageUrls.contactPageCtaImage}
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
                buttonLink='/contact#contact-form'
            />
        </main>
    );
}


