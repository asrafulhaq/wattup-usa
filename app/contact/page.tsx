import { PageHero } from '@/components/drivers/page-hero';

import { ContactForm } from '@/components/contact/contact-form';
import { CTAReady } from '@/components/home/cta-ready';

export default function ContactUsPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/contact-page-hero.png'
                alt='Contact Page Hero Background'
                heading='Get in Touch'
                subHeading={
                    <>
                        Contact our team for support,
                        <br className='hidden sm:block' />
                        partnerships, or general inquiries.
                    </>
                }
                buttonText='Find a Charger'
                buttonLink='/find-charger'
            />

            {/* 2. Contact Form */}
            <ContactForm />

            {/* 3. CTA Section */}
            <CTAReady
                image='/assets/images/contact-page-cta-image.png'
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
                buttonLink='/contact'
            />
        </main>
    );
}

