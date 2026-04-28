import RichTextContent from '@/components/rich-text-content';
import Image from 'next/image';

async function ArticleContent({
    article,
}: {
    article: {
        id: number | string;
        title: string;
        slug: string;
        content: string;
        date: string;
        pinned: boolean;
        image: string;
        imageAlt: string | null;
    };
}) {

    return (
        <article className='flex flex-col gap-8'>
            {/* Main Article Image */}
            {article.image && (
                <div className='mt-8'>
                    <div className='w-full aspect-16/10 bg-placeholderimage rounded-sm overflow-hidden border border-border'>
                        <Image
                            src={article.image}
                            alt={article.title}
                            width={1200}
                            height={750}
                            className='w-full h-full object-cover object-top transition-transform duration-500'
                            priority
                        />
                    </div>
                    <p className='text-text-description text-[12px] mt-2 text-center'>
                        {article?.imageAlt}
                    </p>
                </div>
            )}

            {/* Article Content */}
            <div className='flex flex-col gap-6'>
                <RichTextContent content={article.content} />
            </div>
        </article>
    );
}

export default ArticleContent;

