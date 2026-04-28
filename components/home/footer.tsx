import Link from 'next/link';
import { ThemeToggle } from '../theme-toggle';

const Footer = () => {
    return (
        <footer className='flex items-center text-[14px] leading-[18px] tracking-[-2%]   gap-6'>
            <ThemeToggle />
            <div className='flex text-text-muted items-center justify-start -ml-4'>
                <div className='flex text-nowrap items-center gap-4'>
                    <span>© 2025 Arnav</span>
                </div>
            </div>
            <div className='flex gap-6 text-text-muted'>
                <Link
                    href='/privacy-policy'
                    className='hover:text-foreground transition-colors'>
                    Privacy
                </Link>
                <Link
                    href='/disclaimer'
                    className='hover:text-foreground transition-colors'>
                    Disclaimer
                </Link>
            </div>
        </footer>
    );
};

export default Footer;

