import SocialShare from '@/components/home/social-share';

const ArticleHeader = ({
    article,
}: {
    article: {
        id: number;
        title: string;
        slug: string;
        content: string;
        date: string;
        pinned: boolean;
        image: string;
    };
}) => {
    return (
        <div className='flex flex-col gap-6'>
            <h1 className='text-[40px] md:text-[56px] leading-[44px] md:leading-[64px] tracking-[-2%]  font-bold text-foreground'>
                {article.title}
            </h1>

            <div className='flex items-center justify-between border-b border-border pb-4'>
                <span className='text-[12px] leading-[16px] font-normal tracking-[-3%]  text-text-muted'>
                    {article.date}
                </span>
                <SocialShare />
            </div>
        </div>
    );
};

export default ArticleHeader;

