import { PageHero } from '@/components/drivers/page-hero';
import PolicyLeagals from '@/components/privacy/legal';
import { PrivacyOptions } from '@/components/privacy/privacy-options';
import { policyImageUrls } from '@/lib/images/policy';
import type { Metadata } from 'next';
import { Suspense } from 'react';

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
                url: policyImageUrls.ogImage,
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
                url: policyImageUrls.ogImage,
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
            <Suspense fallback={null}>
                {/* 01. Hero Section */}
                <PageHero
                    image={policyImageUrls.policyPageHero}
                    mobileImage={policyImageUrls.policyPageHeroMobile}
                    alt='Policy Page Hero Background'
                    heading='Privacy and legal'
                    sectionClass='md:h-[810px]!'
                    contentContainerClass='md:items-start w-full md:text-left'
                    headingClass='md:text-left max-md:text-nowrap'
                    overlay
                />

                {/* 2. Policy Options */}
                <PrivacyOptions />

                {/* 3. Policy Leagals */}
                <PolicyLeagals />
            </Suspense>
        </main>
    );
}

