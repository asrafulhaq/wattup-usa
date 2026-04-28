import Link from 'next/link';
import { LiaArrowLeftSolid } from 'react-icons/lia';
const BackButton = ({
    href = '/',
    label = 'Back to Archive',
}: {
    href: string;
    label: string;
}) => {
    return (
        <Link
            href={href}
            className='flex items-center -mb-3 justify-center gap-2 text-[14px] leading-[18px] tracking-[-2%] text-text-muted hover:text-foreground transition-all font-dmSans group w-fit'>
            <LiaArrowLeftSolid className='w-4 h-4 group-hover:-translate-x-0.5 transition-transform' />
            <span>{label}</span>
        </Link>
    );
};

export default BackButton;

