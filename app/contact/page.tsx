import { PageHero } from '@/components/drivers/page-hero';

import { ContactForm } from '@/components/contact/contact-form';
import { CTAReady } from '@/components/home/cta-ready';

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
                image='/assets/images/contact-page-hero.png'
                imageClass='object-cover object-[65%_bottom] max-md:scale-125  md:object-center'
                imageWrapperClass='-mb-7'
                heading='Get in Touch'
                subHeading={
                    <>
                        Contact our team for support,
                        <br className='hidden md:block' />
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
                sectionClass='xl:h-[1080px]'
                image='/assets/images/contact-page-cta-image.png'
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
                buttonLink='/contact'
            />
        </main>
    );
}

