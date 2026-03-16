import Image from 'next/image';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, XIcon } from '../icons/icons';

const COLUMN_1_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'For Drivers', href: '/for-drivers' },
    { label: 'For Hosts', href: '/for-hosts' },
    { label: 'Locations', href: '/locations' },
    { label: 'About', href: '/about' },
];

const COLUMN_2_LINKS = [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Use', href: '/terms-of-use' },
    { label: 'Why WattUp USA', href: '/why-wattup-usa' },
    { label: 'Technology', href: '/technology' },
    { label: 'Who we serve', href: '/who-we-serve' },
];

const SOCIAL_LINKS = [
    { icon: InstagramIcon, href: '#', label: 'Instagram' },
    { icon: FacebookIcon, href: '#', label: 'Facebook' },
    { icon: XIcon, href: '#', label: 'X' },
];

const Footer = () => {
    return (
        <footer className='bg-black w-full pt-[40px] pb-[64px]'>
            <div className='relative z-10 container mx-auto'>
                {/* Top Row: Logo & Links */}
                <div className='flex flex-col lg:flex-row justify-between items-start w-full'>
                    {/* Logo (Left) */}
                    <div className='max-w-[150px] relative h-6 w-[150px] shrink-0 mb-12 lg:mb-0'>
                        <Image
                            src='/assets/images/logo.png'
                            alt='WattUp Logo'
                            fill
                            className='object-contain object-left'
                        />
                    </div>

                    {/* Links (Right) */}
                    <div className='grid grid-cols-2 gap-x-[80px] md:gap-x-[120px] max-md:mb-8'>
                        {/* Column 1 */}
                        <div className='flex flex-col'>
                            {COLUMN_1_LINKS.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className='text-[16px] py-[10px] font-semibold text-white hover:text-primary leading-[129%] tracking-[-3%] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        {/* Column 2 */}
                        <div className='flex flex-col gap-x-4'>
                            {COLUMN_2_LINKS.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className='text-[16px] py-[10px] font-semibold text-white hover:text-primary leading-[129%] tracking-[-3%] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Text & Social Icons */}
                <div className='flex flex-col-reverse md:flex-row justify-between items-start md:items-end gap-12 w-full'>
                    {/* Text block & Copyright (Left) */}
                    <div className='flex text-[14px] text-white/70 leading-[129%] mt-3 flex-col items-start max-w-[700px]'>
                        <p className='mb-[16px]'>
                            Lorem ipsum dolor sit amet consectetur. Blandit enim
                            integer cras id pellentesque dui. Vel duis massa nec
                            consequat. Cursus non hendrerit ut venenatis nunc ut
                            pellentesque magna. Accumsan purus enim est in morbi
                            pellentesque amet ipsum. Cras felis quis enim risus
                            suspendisse interdum. Suspendisse at in nunc nulla
                            quisque ac mattis.
                        </p>
                        <p className='text-white/50'>
                            Copyright © WattUp USA 2026
                        </p>
                    </div>

                    {/* Social Icons (Right) */}
                    <div className='flex items-center gap-[20px] md:gap-[24px] max-md:-mb-7'>
                        {SOCIAL_LINKS.map(social => (
                            <Link
                                key={social.label}
                                href={social.href}
                                aria-label={social.label}
                                className='opacity-50 hover:opacity-100 transition-opacity'>
                                <social.icon />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

