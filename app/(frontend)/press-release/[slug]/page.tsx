import { baseUrl } from '@/app/(frontend)/page';
import PressReleaseDetails from '@/components/press-release/press-release-details';
import PressReleaseDetailsHeader from '@/components/press-release/press-release-details-header';
import { pressReleaseArchiveData } from '@/data';
import type { Metadata } from 'next';
import { Suspense } from 'react';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const pressRelease = pressReleaseArchiveData.find(p => p.slug === slug);

    if (!pressRelease) {
        return {
            title: 'Press Release Not Found | WattUp EV Charging',
            description: 'The requested press release could not be found.',
        };
    }

    return {
        title: `${pressRelease.title} | WattUp EV Charging`,
        description: pressRelease.description.slice(0, 160) + '...',
        openGraph: {
            title: `${pressRelease.title} | WattUp EV Charging`,
            description: pressRelease.description.slice(0, 160) + '...',
            images: [
                {
                    url: `${baseUrl}${pressRelease.image}`,
                    width: 1200,
                    height: 630,
                    alt: pressRelease.title,
                },
            ],
        },
        twitter: {
            title: `${pressRelease.title} | WattUp EV Charging`,
            description: pressRelease.description,
            images: [
                {
                    url: `${baseUrl}${pressRelease.image}`,
                    width: 1200,
                    height: 630,
                    alt: pressRelease.title,
                },
            ],
        },
    };
}

// Extract the async content into a separate async component
async function PressReleaseContent({ params }: Props) {
    const { slug } = await params;
    const pressRelease = pressReleaseArchiveData.find(p => p.slug === slug);

    if (!pressRelease) {
        return (
            <>
                <PressReleaseDetailsHeader
                    title='Press Release Not Found'
                    date='March 25, 2026'
                />
                <article className='common-section-padding container mx-auto'>
                    <p>Press Release Not Found</p>
                </article>
            </>
        );
    }

    return (
        <>
            <PressReleaseDetailsHeader
                title={pressRelease.title}
                date={pressRelease.date}
            />
            <PressReleaseDetails pressRelease={pressRelease} />
        </>
    );
}

// Page component stays synchronous — no await at top level
export default function PressReleaseDetailsPage({ params }: Props) {
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            <Suspense
                fallback={
                    <div className='common-section-padding container mx-auto'>
                        Loading...
                    </div>
                }>
                <PressReleaseContent params={params} />
            </Suspense>
        </main>
    );
}

