'use client';

import {
    banUser,
    deleteUser,
    ManagedUser,
    unbanUser,
    updateUserRole,
} from '@/app/_actions/admin-user-actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ASSIGNABLE_ROLES,
    canManageRole,
    hasPermission,
    Permission,
    ROLE_BADGE_CLASSES,
    ROLE_LABELS,
    Role,
} from '@/lib/permissions';
import { useSession } from '@/lib/auth-client';
import { formatDistanceToNow } from 'date-fns';
import {
    Ban,
    CheckCircle2,
    ChevronDown,
    MoreHorizontal,
    ShieldOff,
    Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { InviteUserDialog } from './invite-user-dialog';

interface Props {
    users: ManagedUser[];
    total: number;
}

type PendingRoleChange = { userId: string; role: Role; userName: string };

export function UsersClient({ users, total }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { data: session } = useSession();
    const currentUserId = session?.user?.id ?? '';
    const currentUserRole = (session?.user as { role?: string })?.role ?? '';
    const [pendingRoleChange, setPendingRoleChange] = useState<PendingRoleChange | null>(null);

    const canInvite = hasPermission(currentUserRole, Permission.INVITE_USERS);
    const canChangeRole = hasPermission(
        currentUserRole,
        Permission.CHANGE_USER_ROLE
    );
    const canBan = hasPermission(currentUserRole, Permission.BAN_USERS);
    const canDelete = hasPermission(currentUserRole, Permission.DELETE_USERS);

    const refresh = () => router.refresh();

    const confirmRoleChange = () => {
        if (!pendingRoleChange) return;
        const { userId, role } = pendingRoleChange;
        startTransition(async () => {
            const result = await updateUserRole(userId, role);
            if (result.success) {
                toast.success('Role updated');
                refresh();
            } else {
                toast.error(result.error);
            }
        });
        setPendingRoleChange(null);
    };

    const handleBan = (userId: string, isBanned: boolean) => {
        startTransition(async () => {
            const result = isBanned
                ? await unbanUser(userId)
                : await banUser(userId);
            if (result.success) {
                toast.success(isBanned ? 'User unbanned' : 'User banned');
                refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleDelete = (userId: string) => {
        startTransition(async () => {
            const result = await deleteUser(userId);
            if (result.success) {
                toast.success('User deleted');
                refresh();
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <div className='flex flex-col gap-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-xl font-bold text-dark'>
                        Users
                    </h1>
                    <p className='text-sm text-dark/50 mt-0.5'>
                        {total} {total === 1 ? 'member' : 'members'} in total
                    </p>
                </div>
                {canInvite && <InviteUserDialog onSuccess={refresh} />}
            </div>

            {/* Table */}
            <div className='rounded-xl border border-border/40 bg-white overflow-hidden shadow-sm'>
                <Table>
                    <TableHeader>
                        <TableRow className='border-border/40'>
                            <TableHead className='pl-6'>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className='pr-4 text-right'>
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className='text-center py-12 text-dark/40'>
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map(user => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    isCurrentUser={user.id === currentUserId}
                                    currentUserRole={currentUserRole}
                                    canChangeRole={canChangeRole}
                                    canBan={canBan}
                                    canDelete={canDelete}
                                    isPending={isPending}
                                    onRoleChange={(userId, role) =>
                                        setPendingRoleChange({ userId, role, userName: user.name ?? user.email })
                                    }
                                    onBan={handleBan}
                                    onDelete={handleDelete}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Role change confirmation */}
            <AlertDialog
                open={!!pendingRoleChange}
                onOpenChange={open => { if (!open) setPendingRoleChange(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change role?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You&apos;re about to change{' '}
                            <span className='font-medium text-dark'>
                                {pendingRoleChange?.userName}
                            </span>
                            &apos;s role to{' '}
                            <span className='font-medium text-dark capitalize'>
                                {pendingRoleChange?.role
                                    ? ROLE_LABELS[pendingRoleChange.role as Role] ?? pendingRoleChange.role
                                    : ''}
                            </span>
                            . This will take effect immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRoleChange}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── UserRow ──────────────────────────────────────────────────────────────────

function UserRow({
    user,
    isCurrentUser,
    currentUserRole,
    canChangeRole,
    canBan,
    canDelete,
    isPending,
    onRoleChange,
    onBan,
    onDelete,
}: {
    user: ManagedUser;
    isCurrentUser: boolean;
    currentUserRole: string;
    canChangeRole: boolean;
    canBan: boolean;
    canDelete: boolean;
    isPending: boolean;
    onRoleChange: (userId: string, role: Role) => void;
    onBan: (userId: string, isBanned: boolean) => void;
    onDelete: (userId: string) => void;
}) {
    const initials = user.name
        ? user.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
        : user.email.slice(0, 2).toUpperCase();

    const targetIsManageable = canManageRole(currentUserRole, user.role);
    const hasActions =
        !isCurrentUser && targetIsManageable && (canChangeRole || canBan || canDelete);

    return (
        <TableRow className='border-border/40'>
            {/* User */}
            <TableCell className='pl-6 py-3'>
                <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 overflow-hidden'>
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={user.name}
                                width={32}
                                height={32}
                                className='w-full h-full object-cover'
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className='min-w-0'>
                        <p className='text-sm font-medium text-dark truncate'>
                            {user.name}
                            {isCurrentUser && (
                                <span className='ml-1.5 text-[10px] text-dark/40'>
                                    (you)
                                </span>
                            )}
                        </p>
                        <p className='text-xs text-dark/50 truncate'>
                            {user.email}
                        </p>
                    </div>
                </div>
            </TableCell>

            {/* Role */}
            <TableCell className='py-3'>
                {canChangeRole && !isCurrentUser && canManageRole(currentUserRole, user.role) ? (
                    <RoleDropdown
                        currentRole={user.role}
                        userId={user.id}
                        actorRole={currentUserRole}
                        isPending={isPending}
                        onRoleChange={onRoleChange}
                    />
                ) : (
                    <RoleBadge role={user.role} />
                )}
            </TableCell>

            {/* Status */}
            <TableCell className='py-3'>
                {user.banned ? (
                    <span className='inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5'>
                        <Ban size={10} />
                        Banned
                    </span>
                ) : (
                    <span className='inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5'>
                        <CheckCircle2 size={10} />
                        Active
                    </span>
                )}
            </TableCell>

            {/* Joined */}
            <TableCell className='py-3 text-xs text-dark/50'>
                {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                })}
            </TableCell>

            {/* Actions */}
            <TableCell className='py-3 pr-4 text-right'>
                {hasActions && (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className='w-8 h-8 rounded-lg flex items-center justify-center text-dark/40 hover:text-dark hover:bg-border/20 transition-colors ml-auto'
                                    disabled={isPending}>
                                    <MoreHorizontal size={16} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-44'>
                                <DropdownMenuLabel className='text-xs text-dark/40'>
                                    Manage user
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {canBan && (
                                    <DropdownMenuItem
                                        className='gap-2 cursor-pointer'
                                        onClick={() =>
                                            onBan(user.id, user.banned)
                                        }>
                                        {user.banned ? (
                                            <>
                                                <ShieldOff size={14} />
                                                Unban user
                                            </>
                                        ) : (
                                            <>
                                                <Ban size={14} />
                                                Ban user
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                )}

                                {canDelete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                className='gap-2 text-red-600 focus:text-red-600 cursor-pointer'>
                                                <Trash2 size={14} />
                                                Delete user
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete {user.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This permanently deletes the user and all
                                    their sessions. This action cannot be
                                    undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className='bg-red-600 hover:bg-red-700 text-white'
                                    onClick={() => onDelete(user.id)}>
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </TableCell>
        </TableRow>
    );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: Role }) {
    return (
        <span
            className={`inline-block text-xs font-medium rounded-full px-2.5 py-0.5 ${ROLE_BADGE_CLASSES[role] ?? ''}`}>
            {ROLE_LABELS[role] ?? role}
        </span>
    );
}

// ─── Role dropdown (editable) ─────────────────────────────────────────────────

function RoleDropdown({
    currentRole,
    userId,
    actorRole,
    isPending,
    onRoleChange,
}: {
    currentRole: Role;
    userId: string;
    actorRole: string;
    isPending: boolean;
    onRoleChange: (userId: string, role: Role) => void;
}) {
    // Only show roles that the actor can assign (must be strictly lower rank)
    const assignable = ASSIGNABLE_ROLES.filter(r => canManageRole(actorRole, r));

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className='flex items-center gap-1 cursor-pointer disabled:opacity-50'
                    disabled={isPending}>
                    <RoleBadge role={currentRole} />
                    <ChevronDown size={12} className='text-dark/40' />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-40'>
                <DropdownMenuLabel className='text-xs text-dark/40'>
                    Change role
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {assignable.map(role => (
                    <DropdownMenuItem
                        key={role}
                        className='gap-2 cursor-pointer'
                        disabled={role === currentRole}
                        onClick={() => onRoleChange(userId, role)}>
                        <RoleBadge role={role} />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
