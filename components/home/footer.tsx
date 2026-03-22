import Image from 'next/image';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, XIcon } from '../icons/icons';

const COLUMN_1_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'For Drivers', href: '/for-drivers' },
    { label: 'For Hosts', href: '/for-hosts' },
    { label: 'Locations', href: '#' },
    { label: 'About', href: '/about' },
];

const COLUMN_2_LINKS = [
    { label: 'Privacy Policy', href: '/policy' },
    { label: 'Terms of Use', href: '/policy#legal' },
    { label: 'Why WattUp USA', href: '/#why-wattup' },
    { label: 'Technology', href: '/#technology' },
    { label: 'Who we serve', href: '/#who-we-serve' },
];

const SOCIAL_LINKS = [
    { icon: InstagramIcon, href: '/#', label: 'Instagram' },
    { icon: FacebookIcon, href: '/#', label: 'Facebook' },
    { icon: XIcon, href: '/#', label: 'X' },
];

const Footer = () => {
    return (
        <footer className='bg-black w-full py-10 px-6'>
            <div className='relative z-10 max-w-[1444px] mx-auto flex flex-col lg:grid lg:grid-cols-[1fr_auto] lg:gap-x-12'>
                {/* 1. Logo (Order 1 Mobile, Hidden Desktop) */}
                <div className='lg:hidden max-w-[150px] relative h-6 w-[150px] shrink-0 mb-8 order-1'>
                    <Image
                        src='/assets/images/logo.png'
                        alt='WattUp Logo'
                        fill
                        className='object-contain object-left'
                    />
                </div>

                {/* 2. Links (Order 2 Mobile, Top Right Desktop) */}
                <div className='order-2 lg:col-start-2 lg:row-start-1 mb-[24px] lg:mb-0'>
                    <div className='grid grid-cols-2 gap-x-[30px] md:gap-x-[120px]'>
                        <div className='flex flex-col'>
                            {COLUMN_1_LINKS.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className='text-[16px] py-[10px] font-semibold text-white hover:text-primary leading-[130%] text-nowrap tracking-[-3%] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className='flex flex-col'>
                            {COLUMN_2_LINKS.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className='text-[16px] py-[10px] font-semibold text-white hover:text-primary leading-[130%] text-nowrap tracking-[-3%] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Social Icons (Order 3 Mobile, Bottom Right Desktop) */}
                <div className='order-3 lg:col-start-2 lg:row-start-2 flex items-center gap-[24px] mb-8 lg:mb-0 lg:mt-[60px] lg:justify-end'>
                    {SOCIAL_LINKS.map(social => (
                        <Link
                            key={social.label}
                            href={social.href}
                            aria-label={social.label}
                            className='opacity-80 hover:opacity-100 transition-opacity'>
                            <social.icon />
                        </Link>
                    ))}
                </div>

                {/* 4. Descriptive Text (Order 4 Mobile, Top Left Desktop) */}
                <div className='order-4 lg:col-start-1 lg:row-start-1 max-w-[320px] md:max-w-[596px] mb-4  lg:mb-0 text-[14px] text-white/60 leading-[129%] tracking-[-3%]'>
                    <p className='text-[14px] text-white/60 leading-[130%] tracking-[-3%] mb-0 md:mb-4'>
                        Lorem ipsum dolor sit amet consectetur. Blandit enim
                        integer cras id pellentesque dui. Vel duis massa nec
                        consequat. Cursus non hendrerit ut venenatis nunc ut
                        pellentesque magna. Accumsan purus enim est in morbi
                        pellentesque amet ipsum. Cras felis quis enim risus
                        suspendisse interdum. Suspendisse at in nunc nulla
                        quisque ac mattis.
                    </p>{' '}
                    <p className='text-[14px] hidden md:block text-white/70 leading-[130%] tracking-[-1%]'>
                        Lorem ipsum dolor sit amet consectetur. Blandit sem est
                        eget ut sed pellentesque dui. Vel duis massa ac nec
                        consequat. Cursus non hendrerit ut vitae donec ut
                        ullamcorper magna.
                    </p>
                </div>

                {/* 5. Copyright (Order 5 Mobile, Bottom Left Desktop) */}
                <div className='order-5 lg:col-start-1 lg:row-start-2 lg:pt-0 lg:mt-[48px]'>
                    <p className='text-[14px] text-white/50 leading-[130%] tracking-[-1%]'>
                        Copyright © WattUp USA 2026
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

