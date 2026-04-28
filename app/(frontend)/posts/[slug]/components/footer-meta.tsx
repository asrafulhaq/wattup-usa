import SocialShare from '@/components/home/social-share';

const FooterMetadata = ({
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
        <div className='flex items-center justify-between border-b border-border pb-4 mt-8'>
            <span className='text-[14px] leading-[18px] text-text-muted '>
                {article.date}
            </span>
            <SocialShare />
        </div>
    );
};

export default FooterMetadata;

