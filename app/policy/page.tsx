import { PageHero } from '@/components/drivers/page-hero';
import PolicyLeagals from '@/components/privacy/legal';
import { PrivacyOptions } from '@/components/privacy/privacy-options';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | WattUp USA',
    description:
        'Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.',
};

export default function PolicyPage() {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image='/assets/images/policy-page-hero.png'
                alt='Policy Page Hero Background'
                heading='Privacy and legal'
                imageClass='md:-mt-[172px] max-md:object-[-13%_bottom] max-md:scale-150'
                sectionClass='max-md:h-[604px]'
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

