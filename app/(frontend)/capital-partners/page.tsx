import { AccessRequest } from '@/components/capital-partners/access-request';
import ImageSectionFade from '@/components/capital-partners/image-section-fade';
import { SectionIntro } from '@/components/capital-partners/section-intro';
import { TractionSnapshot } from '@/components/capital-partners/traction-snapshot';
import { PageHero } from '@/components/drivers/page-hero';
import { StepGrid } from '@/components/ui/step-grid';
import { CapitalPartnersWhyData } from '@/data';
import { capitalPartnersImageUrls } from '@/lib/images/capital-partners';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Capital Partners | WattupUSA',
    description:
        'Explore WattupUSA’s Capital Partners page to understand our collaboration model for bringing EV charging to communities nationwide.',
    openGraph: {
        title: 'Capital Partners | WattupUSA',
        description:
            'Explore WattupUSA’s Capital Partners page to understand our collaboration model for bringing EV charging to communities nationwide.',
        images: [
            {
                url: capitalPartnersImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattupUSA EV Charging',
            },
        ],
    },
    twitter: {
        title: 'Capital Partners | WattupUSA',
        description:
            'Explore WattupUSA’s Capital Partners page to understand our collaboration model for bringing EV charging to communities nationwide.',
        images: [
            {
                url: capitalPartnersImageUrls.ogImage,
                width: 1200,
                height: 630,
                alt: 'WattupUSA EV Charging',
            },
        ],
    },
};

export default function CapitalPartnersPage() {
    return (
        <main className='flex min-h-screen w-full flex-col bg-background selection:bg-primary/20'>
            {/* 01. Hero Section */}
            <PageHero
                image={capitalPartnersImageUrls.heroImage}
                mobileImage={capitalPartnersImageUrls.heroImageMobile}
                alt='Capital Partners Page Hero Background'
                sectionClass='h-[448px] md:h-[554px]!'
            />

            {/* 02. Intro */}
            <SectionIntro />

            {/* 03. Why Wattup Usa */}
            <StepGrid
                heading='Why WattupUSA'
                stepData={CapitalPartnersWhyData}
                gridClass='grid-cols-2 max-lg:gap-8 lg:grid-cols-4'
                descClass='text-[16px]! font-medium! leading-[130%] tracking-[-3%]'
                titleClass='text-[28px]! font-bold!'
                cardImageHeight='h-[373px]'
            />

            {/* 04. Traction Snapshot */}
            <TractionSnapshot />

            {/*  05. Ledership */}
            <ImageSectionFade
                image={capitalPartnersImageUrls.leadership}
                mobileImage={capitalPartnersImageUrls.leadershipMobile}
                heading={'Leadership & Governance'}
                subHeading={
                    'WattupUSA is led by a team with experience across infrastructure development, operations, and capital management. The company maintains a disciplined approach to deployment, prioritizing long-term asset performance and sustainable growth.'
                }
            />

            {/* 06. Access Form */}
            <AccessRequest />
        </main>
    );
}


