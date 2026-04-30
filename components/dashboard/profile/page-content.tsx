import { getProfile, getSocialLinks } from '@/app/_actions/userActions';
import CredentialsUpdate from './credentials-update';
import PersonalInformation from './personal-information';
import SocialLinks from './social-links';

const PageContent = async () => {
    const [profile, socialLinks] = await Promise.all([
        getProfile(),
        getSocialLinks(),
    ]);

    // Default profile if none exists.
    // profile.image is stored as Json in the DB: { url, public_id } | null
    const safeProfile = {
        id: profile?.id || 'default-profile-id',
        name: profile?.name || '',
        bio: profile?.bio || '',
        // Pass the raw image field — PersonalInformation handles both
        // the legacy string format and the new { url, public_id } JSON format.
        image: profile?.image ?? null,
        about: profile?.about || '',
    };

    return (
        <div className='flex flex-col gap-6 w-full'>
            {/* Top row: Personal Info + Social Links */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 w-full'>
                <PersonalInformation profile={safeProfile} />
                <SocialLinks initialLinks={socialLinks || []} />
            </div>

            {/* About section — full width */}
            {/* <About profile={safeProfile} /> */}

            {/* Credentials — full width, two cards inside */}
            <CredentialsUpdate />
        </div>
    );
};

export default PageContent;

