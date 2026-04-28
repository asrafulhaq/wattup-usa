import { baseUrl } from '@/app/(frontend)/page';
import PressReleaseDetails from '@/components/press-release/press-release-details';
import PressReleaseDetailsHeader from '@/components/press-release/press-release-details-header';
import { pressReleaseArchiveData } from '@/data';
import type { Metadata } from 'next';

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

export default async function PressReleaseDetailsPage({ params }: Props) {
    const { slug } = await params;
    const pressRelease = pressReleaseArchiveData.find(p => p.slug === slug);

    if (!pressRelease) {
        return (
            <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
                {/* 01. Header Section */}
                <PressReleaseDetailsHeader
                    title='Press Release Not Found'
                    date='March 25, 2026'
                />
                <article className='common-section-padding container mx-auto'>
                    <p>Press Release Not Found</p>
                </article>
            </main>
        );
    }
    return (
        <main className='flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20'>
            {/* 01. Header Section */}
            <PressReleaseDetailsHeader
                title={pressRelease?.title || ''}
                date={pressRelease?.date || ''}
            />

            {/* 02. Press Release Details Section */}
            <PressReleaseDetails pressRelease={pressRelease} />
        </main>
    );
}

