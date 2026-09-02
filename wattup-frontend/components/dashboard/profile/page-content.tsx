import { getSocialLinks } from '@/app/_actions/userActions';
import { getSessionPermissions } from '@/lib/permission-guard';
import { hasPermission, Permission } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { describeUserPermissions } from '@/lib/permissions-server';
import CredentialsUpdate from './credentials-update';
import { MyAccess } from './my-access';
import PersonalInformation from './personal-information';
import SocialLinks from './social-links';

const PageContent = async () => {
    const authorised = await getSessionPermissions();
    if (!authorised) return null;
    const { session, permissions } = authorised;

    const [user, socialLinks, permissionRows] = await Promise.all([
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
        describeUserPermissions(session.id),
    ]);

    const canManageSocialLinks = hasPermission(permissions, Permission.MANAGE_SOCIAL_LINKS);

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
            {/* Your own role and permissions, read only (checklist 4c.8, 4c.9). */}
            <MyAccess role={session.role} rows={permissionRows} />
            <CredentialsUpdate />
        </div>
    );
};

export default PageContent;
