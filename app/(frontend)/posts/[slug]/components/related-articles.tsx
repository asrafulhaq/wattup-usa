import { getArticles } from '@/app/_actions/postActions';
import Article from '@/components/home/article';
import { Reveal, RevealList } from '@/components/reveal-animation';

const RelatedArticles = async ({ slug }: { slug: string }) => {
    const allArticles = await getArticles();
    const moreArticles = allArticles
        .filter(a => a.slug !== slug)
        .slice(0, 4)
        .map(a => ({
            ...a,
            date: a.createdAt.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
        }));
    if (!moreArticles.length) return null;
    return (
        <div className='flex flex-col py-6 gap-12'>
            <Reveal>
                <h3 className='text-[32px] md:text-[40px] leading-[36px] md:leading-[44px] tracking-[-2%]  font-bold text-foreground'>
                    More from Arnav
                </h3>
            </Reveal>
            <div className='flex flex-col gap-12'>
                <RevealList staggerDelay={0.05} delay={0.1}>
                    {moreArticles.map(a => (
                        <Article key={a.id} article={a as any} />
                    ))}
                </RevealList>
            </div>
        </div>
    );
};

export default RelatedArticles;

