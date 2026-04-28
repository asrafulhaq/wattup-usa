import { getArticles } from '@/app/_actions/postActions';
import Article from '@/components/home/article';
import { RevealList } from '@/components/reveal-animation';

export const ArticleLists = async () => {
    const articles = await getArticles();

    const formattedArticles = articles
        .sort((a, b) => (b.pinned ? 1 : -1) - (a.pinned ? 1 : -1))
        .map(article => ({
            ...article,
            date: article.createdAt.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }),
        }));
    return (
        <RevealList staggerDelay={0.05}>
            {formattedArticles.map(article => (
                <Article key={article.id} article={article as any} />
            ))}
        </RevealList>
    );
};

