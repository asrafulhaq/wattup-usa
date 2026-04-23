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
            <h3 className='headline-5 text-dark'>{title}</h3>
            <p
                className={`text-description text-dark/70 transition-opacity ${descriptionClass}`}>
                {description}
            </p>
            <Link
                href={linkHref}
                target={isExternal ? '_blank' : undefined}
                className={`text-[16px] md:text-[24px] font-semibold md:font-medium  md:leading-[100%] leading-[130%] tracking-[-3%] w-fit 
                    ${isBlueLink ? 'text-[16px]! text-primary hover:text-primary-hover' : 'text-dark hover:text-dark/70 underline '}`}>
                {linkText}
            </Link>
        </div>
    );
};

export const ContactInfo = () => {
    return (
        <section className='w-full py-[82px] bg-white'>
            <div className='container max-w-[1360px] mx-auto px-10'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-[20px]'>
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

