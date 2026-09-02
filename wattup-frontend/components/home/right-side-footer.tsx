'use client';
import { usePathname } from 'next/navigation';
import Footer from './footer';

const RightSideFooter = () => {
    const pathname = usePathname();
    if (pathname.includes('/posts')) return null;
    return <Footer />;
};

export default RightSideFooter;

