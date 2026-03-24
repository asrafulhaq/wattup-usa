import { PageHero } from '@/components/drivers/page-hero';
import PolicyLeagals from '@/components/privacy/legal';
import { PrivacyOptions } from '@/components/privacy/privacy-options';
import type { Metadata } from 'next';
import { baseUrl } from '../page';

export const metadata: Metadata = {
    title: 'Privacy Policy | WattUp USA',
    description:
        'Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.',
        openGraph: {
            title: 'Privacy Policy | WattUp USA',
            description:
                'Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.',
            images: [
                {
                    url: `${baseUrl}/assets/images/policy/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: 'WattUp USA EV Charging',
                },
            ],
        },
        twitter: {
            title: 'Privacy Policy | WattUp USA',
            description:
                'Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.',
            images: [
                {
                    url: `${baseUrl}/assets/images/policy/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: 'WattUp USA EV Charging',
                },
            ],
        },
};

export default function PolicyPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/policy/policy-page-hero.png'
                alt='Policy Page Hero Background'
                heading='Privacy and legal'
                imageClass='max-md:object-[-13%_bottom] max-md:scale-150'
                sectionClass='max-md:h-[554px] md:h-[810px]! '
                contentContainerClass='md:items-start w-full md:text-left'
                headingClass='md:text-left max-md:text-nowrap'
                overlay
            />

            {/* 2. Policy Options */}
            <PrivacyOptions />

            {/* 3. Policy Leagals */}
            <PolicyLeagals />
        </main>
    );
}




