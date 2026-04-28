import { getProfile, getSocialLinks } from '@/app/_actions/userActions';
import Image from 'next/image';
import Link from 'next/link';
import { GoArrowUpRight } from 'react-icons/go';

const AuthorBio = async () => {
    const [profile, socialLinks] = await Promise.all([
        getProfile(),
        getSocialLinks(),
    ]);
    const linkedin = socialLinks.find(link => link.name === 'LinkedIn');
    return (
        <>
            {/* Desktop */}
            <div className=' hidden md:flex flex-col gap-2'>
                <div className='w-12 h-12 rounded-full overflow-hidden bg-placeholderimage border border-border shrink-0'>
                    <Image
                        src={profile?.image || '/images/Arnab.jpeg'}
                        alt='Arnav Emir'
                        width={48}
                        height={48}
                        className='object-cover'
                    />
                </div>
                <div className='flex flex-col gap-2 tracking-[-2%]'>
                    <h2 className='text-[16px] leading-[22px]   font-medium text-primary'>
                        {profile?.name || 'Arnav Emir'}
                    </h2>
                    <p className='text-[14px] leading-[18px] text-primary '>
                        {profile?.bio ||
                            'Writing about product thinking, innovation, and the edges of intuition.'}
                    </p>
                    <Link
                        href={linkedin?.url || '#'}
                        className='flex text-[14px] leading-[18px] text-primary font-dmSans font-medium mt-[32px] items-center hover:text-foreground transition-all group'>
                        LinkedIn{' '}
                        <GoArrowUpRight className='w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                    </Link>
                </div>
            </div>

            {/* Mobile */}
            <div className='md:hidden flex flex-col gap-2 py-8'>
                <div className='flex flex-col gap-2 '>
                    <div className='w-12 h-12 rounded-full overflow-hidden bg-placeholderimage shrink-0 border border-border'>
                        <Image
                            src={profile?.image || '/images/Arnab.jpeg'}
                            alt='Arnav Emir'
                            width={48}
                            height={48}
                            className='object-cover'
                        />
                    </div>
                    <div className='flex items-center gap-2'>
                        <h2 className='text-[16px] leading-[22px]   font-medium text-primary'>
                            {profile?.name || 'Arnav Emir'}
                        </h2>
                        <Link
                            href={linkedin?.url || '#'}
                            className='flex text-[14px] leading-[18px] text-primary font-dmSans font-medium mb-[2px] items-center hover:text-foreground transition-all group'>
                            LinkedIn{' '}
                            <GoArrowUpRight className='w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                        </Link>
                    </div>
                </div>
                <p className='text-[14px] leading-[18px] text-primary '>
                    {profile?.bio ||
                        'Writing about product thinking, innovation, and the edges of intuition.'}
                </p>
            </div>
        </>
    );
};

export default AuthorBio;

