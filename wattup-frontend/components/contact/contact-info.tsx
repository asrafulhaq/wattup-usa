import { FadeUp } from '@/components/ui/fade-up';
import { ContactInfoData } from '@/data';
import Link from 'next/link';

interface ContactItemProps {
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
    isExternal?: boolean;
    isBlueLink?: boolean;
    descriptionClass?: string;
}

const ContactItem = ({
    title,
    description,
    linkText,
    linkHref,
    isExternal = false,
    isBlueLink = false,
    descriptionClass,
}: ContactItemProps) => {
    return (
        <div className='flex flex-col gap-3 md:gap-[12px]'>
            <h3 className=' text-[28px] font-bold leading-[110%] tracking-[-3%] md:text-[32px] md:font-semibold text-dark'>
                {title}
            </h3>
            <p
                className={`text-description max-md:max-w-[327px] max-md:font-normal! text-dark/70 transition-opacity ${descriptionClass}`}>
                {description}
            </p>
            <Link
                href={linkHref}
                target={isExternal ? '_blank' : undefined}
                className={`text-[16px] md:text-[24px] font-semibold md:font-medium  md:leading-[100%] leading-[130%] tracking-[-3%] w-fit 
                    ${isBlueLink ? 'text-[16px]! max-md:py-2.5 text-primary hover:text-primary-hover' : 'text-dark hover:text-dark/70 underline '}`}>
                {linkText}
            </Link>
        </div>
    );
};

export const ContactInfo = () => {
    return (
        <section className='w-full py-[80px] bg-white'>
            <div className='container  mx-auto '>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                    {ContactInfoData.map((item, index) => (
                        <FadeUp key={index} delay={index * 0.1}>
                            <ContactItem {...item} />
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ContactInfo;

