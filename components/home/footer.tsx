import { getSiteSettings } from '@/app/_actions/settingsActions';
import Image from 'next/image';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from '../icons/icons';

const COLUMN_1_LINKS = [
    { label: 'Home', href: '/' },
    { label: 'For  Drivers', href: '/for-drivers' },
    { label: 'For  Hosts', href: '/for-hosts' },
    { label: 'Locations', href: '/locations' },
    { label: 'About', href: '/about' },
];

const COLUMN_2_LINKS = [
    { label: 'Privacy Policy', href: '/policy' },
    { label: 'Terms of Use', href: '/policy#legal' },
    { label: 'Press Releases', href: '/press-release' },
    { label: 'Capital Partners', href: '/capital-partners' },
    { label: 'FAQs', href: '/faq' },
];

const Footer = async () => {
    const settings = await getSiteSettings();

    const socialLinks = [
        {
            icon: LinkedInIcon,
            href: settings?.orgLinkedin || null,
            label: 'LinkedIn',
        },
        {
            icon: InstagramIcon,
            href: settings?.orgInstagram || null,
            label: 'Instagram',
        },
        {
            icon: FacebookIcon,
            href: settings?.orgFacebook || null,
            label: 'Facebook',
        },
        {
            icon: XIcon,
            href: settings?.orgTwitter || null,
            label: 'X',
        },
    ].filter(s => s.href);

    return (
        <footer className='bg-black w-full py-10 px-6'>
            <div className='relative z-10 max-w-361 mx-auto flex flex-col lg:grid lg:grid-cols-[1fr_auto] lg:gap-x-12'>
                {/* 1. Logo (Order 1 Mobile, Hidden Desktop) */}
                <div className='hidden max-w-37.5 relative h-6 w-37.5 shrink-0 mb-8 order-1'>
                    <Image
                        src='/assets/images/shared/logo.svg'
                        alt='WattUp Logo'
                        fill
                        className='object-contain object-left'
                    />
                </div>

                {/* 2. Links (Order 2 Mobile, Top Right Desktop) */}
                <div className='order-2 lg:col-start-2 lg:row-start-1 mb-6 lg:mb-0'>
                    <div className='grid grid-cols-2 gap-x-7.5 md:gap-x-30'>
                        <div className='flex flex-col'>
                            {COLUMN_1_LINKS.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className='text-[16px] py-2.5 font-semibold text-white hover:text-primary leading-[130%] text-nowrap tracking-[2%] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className='flex flex-col'>
                            {COLUMN_2_LINKS.map(link => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className='text-[16px] py-2.5 font-semibold text-white hover:text-primary leading-[130%] text-nowrap tracking-[2%] transition-colors'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Social Icons (Order 3 Mobile, Bottom Right Desktop) */}
                {socialLinks.length > 0 && (
                    <div className='order-3 lg:col-start-2 lg:row-start-2 flex items-center gap-6 mb-8 lg:mb-0 lg:mt-15 lg:justify-end'>
                        {socialLinks.map(social => (
                            <Link
                                key={social.label}
                                href={social.href!}
                                aria-label={social.label}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='opacity-80 hover:opacity-100 transition-opacity'>
                                <social.icon />
                            </Link>
                        ))}
                    </div>
                )}

                {/* 4. Descriptive Text (Order 4 Mobile, Top Left Desktop) */}
                <div className='order-4 lg:col-start-1 lg:row-start-1 max-w-80 md:max-w-149 mb-4 lg:mb-0 text-[14px] text-white/60 leading-[129%] tracking-[-3%]'>
                    <p className='text-[14px] text-white/60 font-normal leading-[130%] tracking-[-3%] mb-0 md:mb-4'>
                        WattUp USA operates a growing EV charging network.
                        Availability, performance, and access to charging
                        services may vary by location and are subject to change
                        without notice. Certain features, pricing, and
                        availability may differ based on region and site
                        conditions.
                    </p>{' '}
                    <p className='text-[14px] text-white/60 font-normal leading-[130%] tracking-[-3%] my-4 md:mb-5'>
                        Please review our{' '}
                        <Link href='/policy#legal' className=''>
                            Terms of Use
                        </Link>{' '}
                        and{' '}
                        <Link href='/policy' className=''>
                            Privacy Policy
                        </Link>{' '}
                        for additional information.
                    </p>{' '}
                </div>

                {/* 5. Copyright (Order 5 Mobile, Bottom Left Desktop) */}
                <div className='order-5 lg:col-start-1 lg:row-start-2 lg:pt-0 lg:mt-12'>
                    <p className='text-[14px] text-white/50 leading-[130%] tracking-[-1%]'>
                        Copyright © {settings?.orgName || 'WattUp USA'} 2026
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

