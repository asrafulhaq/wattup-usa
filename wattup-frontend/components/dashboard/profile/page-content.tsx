import { getSession } from '@/app/_actions/auth-actions';
import { getSocialLinks } from '@/app/_actions/userActions';
import { hasPermission, Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import CredentialsUpdate from './credentials-update';
import PersonalInformation from './personal-information';
import SocialLinks from './social-links';

const PageContent = async () => {
    const session = await getSession();
    if (!session) return null;

    const [user, socialLinks] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.id },
            select: {
                name: true,
                bio: true,
                image: true,
                imagePublicId: true,
            },
        }),
        getSocialLinks(session.id),
    ]);

    const canManageSocialLinks = hasPermission(
        session.role,
        Permission.MANAGE_SOCIAL_LINKS
    );

    return (
        <div className='flex flex-col gap-6 w-full'>
            <div className={`grid grid-cols-1 gap-6 w-full${canManageSocialLinks ? ' md:grid-cols-2' : ''}`}>
                <PersonalInformation
                    user={{
                        name: user?.name ?? session.name ?? '',
                        bio: user?.bio ?? '',
                        image: user?.image ?? null,
                        imagePublicId: user?.imagePublicId ?? null,
                    }}
                />
                {canManageSocialLinks && (
                    <SocialLinks initialLinks={socialLinks || []} />
                )}
            </div>
            <CredentialsUpdate />
        </div>
    );
};

export default PageContent;
