import Image from 'next/image';
import { FadeUp } from '../ui/fade-up';
import RichTextContent from '../rich-text-content';

// Matches the shape returned by getArticleBySlug
interface Article {
    id: string;
    title: string;
    content: string | null;
    image?: string | null;
    imageAlt?: string | null;
    publishedAt: string | Date | null;
}

const PressReleaseDetails = ({ article }: { article: Article }) => {
    return (
        <article className='w-full common-section-padding bg-background'>
            <div className='container max-md:px-4 items-center w-full max-w-[700px] mx-auto flex flex-col'>
                {/* Hero Image */}
                {article.image && (
                    <FadeUp className='w-full max-w-[700px] h-[293px] sm:h-[400px] rounded-[12px] overflow-hidden max-md:mx-4 mb-[40px] relative'>
                        <Image
                            src={article.image}
                            alt={article.imageAlt || article.title}
                            fill
                            className='object-cover'
                        />
                    </FadeUp>
                )}

                {/* Dynamic Rich Text Content */}
                <FadeUp className='w-full'>
                    <RichTextContent
                        content={article.content}
                        className='text-dark'
                    />
                </FadeUp>
            </div>
        </article>
    );
};

export default PressReleaseDetails;

