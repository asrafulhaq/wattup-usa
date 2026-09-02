'use client';

import { useTransition } from 'react';
import { logout } from '@/app/_actions/auth-actions';
import { Loader2, LogOut } from 'lucide-react';

export function LogoutButton() {
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await logout();
        });
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isPending}
            className='inline-flex items-center gap-2 h-[42px] px-5 rounded-[10px] border border-border/40 bg-white text-[15px] font-bold text-dark transition-all hover:bg-red-50 hover:border-red-100 hover:text-red-600 active:scale-[0.97] disabled:opacity-50 shadow-sm'
        >
            {isPending ? (
                <Loader2 size={16} className='animate-spin' />
            ) : (
                <LogOut size={16} />
            )}
            {isPending ? 'Signing out…' : 'Sign Out'}
        </button>
    );
}
