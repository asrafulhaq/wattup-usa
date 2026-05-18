import Image from 'next/image';
import Link from 'next/link';
import SocialShare from './social-share';

const Article = ({
    article,
}: {
    article: {
        id: number | string;
        title: string;
        slug: string;
        content: string;
        date: string;
        image?: string | null;
    };
}) => {
    // Strip HTML tags for the preview text
    const previewText = article.content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return (
        <article
            key={article.id}
            className='group relative flex flex-row gap-4 justify-between items-center border-b border-border pb-4'>
            <div className='flex-1 flex flex-col gap-8'>
                <div className='flex items-center justify-between  font-medium text-[12px] leading-[14px] uppercase tracking-[-3%] text-text-muted'>
                    <SocialShare />
                </div>
                <div className='flex flex-col gap-2'>
                    <h3 className='text-xl md:text-[24px] leading-[26px] tracking-[-1%]  font-medium group-hover:text-primary transition-colors'>
                        <Link href={`/posts/${article.slug}`}>
                            {article.title}
                        </Link>
                    </h3>
                    <p className='text-sm md:text-[16px] line-clamp-2 text-text-description leading-[23px] font-normal tracking-[-2%] '>
                        {previewText}
                    </p>
                </div>
                <span className='text-[12px] leading-[16px] font-normal tracking-[-3%]  text-text-muted'>
                    {article.date}
                </span>
            </div>
            {article.image && (
                <div className='w-[106px] h-[80px] md:w-[172px] md:h-[129px] bg-placeholderimage rounded-sm overflow-hidden shrink-0 border border-border'>
                    <Image
                        src={article.image}
                        alt={article.title}
                        width={400}
                        height={400}
                        className='w-full h-full object-cover object-top transition-all duration-700 ease-in-out'
                    />
                </div>
            )}
        </article>
    );
};

export default Article;

