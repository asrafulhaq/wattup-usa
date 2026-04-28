import { Reveal } from '@/components/reveal-animation';
import { Suspense } from 'react';
import { AuthorBioSkeleton } from '../skeletons/author-bio-skeleton';
import AuthorBio from './author-bio';
import RightSideFooter from './right-side-footer';

const RightSidebar = async () => {
    return (
        <aside className='hidden md:flex md:w-[400px] flex-col pt-[104px] h-screen bg-card shrink-0'>
            <Reveal delay={0.3} yOffset={0} duration={0.8} className='h-full'>
                <div className='flex flex-col h-full pl-10 pr-10 justify-between pb-4'>
                    {/* Top Content (Desktop Bio) */}
                    <Suspense fallback={<AuthorBioSkeleton />}>
                        <AuthorBio />
                    </Suspense>

                    {/* Footer Content */}
                    <Suspense fallback={null}>
                        <RightSideFooter />
                    </Suspense>
                </div>
            </Reveal>
        </aside>
    );
};

export default RightSidebar;

