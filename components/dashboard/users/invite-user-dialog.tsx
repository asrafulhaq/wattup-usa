'use client';

import { createUser } from '@/app/_actions/admin-user-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ASSIGNABLE_ROLES, ROLE_LABELS, Role } from '@/lib/permissions';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Eye, EyeOff, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum([Role.ADMIN, Role.EDITOR, Role.COLLABORATOR]),
    sendInviteEmail: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Password generator ───────────────────────────────────────────────────────

const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{}',
};

function generateStrongPassword(length = 16): string {
    const all = CHARS.upper + CHARS.lower + CHARS.digits + CHARS.symbols;
    const required = [
        CHARS.upper[Math.floor(Math.random() * CHARS.upper.length)],
        CHARS.lower[Math.floor(Math.random() * CHARS.lower.length)],
        CHARS.digits[Math.floor(Math.random() * CHARS.digits.length)],
        CHARS.symbols[Math.floor(Math.random() * CHARS.symbols.length)],
    ];
    const rest = Array.from({ length: length - 4 }, () =>
        all[Math.floor(Math.random() * all.length)]
    );
    return [...required, ...rest]
        .sort(() => Math.random() - 0.5)
        .join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    onSuccess?: () => void;
}

export function InviteUserDialog({ onSuccess }: Props) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: Role.COLLABORATOR,
            sendInviteEmail: true,
        },
    });

    const passwordValue = watch('password') ?? '';

    const handleGenerate = () => {
        const pwd = generateStrongPassword();
        setValue('password', pwd, { shouldValidate: true });
        setShowPassword(true);
    };

    const handleCopyPassword = () => {
        if (passwordValue) {
            navigator.clipboard.writeText(passwordValue);
            toast.success('Password copied to clipboard');
        }
    };

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await createUser({
                name: values.name,
                email: values.email,
                password: values.password,
                role: values.role,
                sendInviteEmail: values.sendInviteEmail,
            });

            if (result.success) {
                if (result.emailError) {
                    toast.warning(`User created. Note: ${result.emailError}`);
                } else if (values.sendInviteEmail) {
                    toast.success(`User ${values.name} created and invite email sent`);
                } else {
                    toast.success(`User ${values.name} created successfully`);
                }
                reset();
                setShowPassword(false);
                setOpen(false);
                onSuccess?.();
            } else {
                toast.error(result.error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className='flex items-center gap-2'>
                    <UserPlus size={16} />
                    Add User
                </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-[460px]'>
                <DialogHeader>
                    <DialogTitle>Add a new user</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className='flex flex-col gap-4 mt-2'>
                    {/* Name */}
                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-foreground'>
                            Full name
                        </label>
                        <input
                            type='text'
                            placeholder='Jane Doe'
                            className='input-field'
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className='text-xs text-red-600'>
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-foreground'>
                            Email address
                        </label>
                        <input
                            type='email'
                            placeholder='jane@example.com'
                            className='input-field'
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className='text-xs text-red-600'>
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Password with generator */}
                    <div className='flex flex-col gap-1.5'>
                        <div className='flex items-center justify-between'>
                            <label className='text-sm font-medium text-foreground'>
                                Initial password
                            </label>
                            <button
                                type='button'
                                onClick={handleGenerate}
                                className='flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium'>
                                <RefreshCw size={12} />
                                Suggest password
                            </button>
                        </div>

                        <div className='relative'>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Min 8 characters'
                                className='input-field pr-20 font-mono text-sm'
                                autoComplete='new-password'
                                {...register('password')}
                            />

                            {/* Copy button — shows only when there's a value */}
                            {passwordValue && (
                                <button
                                    type='button'
                                    tabIndex={-1}
                                    onClick={handleCopyPassword}
                                    title='Copy password'
                                    className='absolute right-10 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark transition-colors'>
                                    <Copy size={15} />
                                </button>
                            )}

                            {/* Show/hide toggle */}
                            <button
                                type='button'
                                tabIndex={-1}
                                onClick={() => setShowPassword(v => !v)}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 hover:text-dark transition-colors'>
                                {showPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>

                        {errors.password && (
                            <p className='text-xs text-red-600'>
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Role */}
                    <div className='flex flex-col gap-1.5'>
                        <label className='text-sm font-medium text-foreground'>
                            Role
                        </label>
                        <select
                            className='input-field bg-white'
                            {...register('role')}>
                            {ASSIGNABLE_ROLES.map(role => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                </option>
                            ))}
                        </select>
                        {errors.role && (
                            <p className='text-xs text-red-600'>
                                {errors.role.message}
                            </p>
                        )}
                    </div>

                    {/* Send invite email */}
                    <label className='flex items-center gap-2.5 cursor-pointer select-none'>
                        <input
                            type='checkbox'
                            className='w-4 h-4 rounded accent-primary'
                            {...register('sendInviteEmail')}
                        />
                        <span className='text-sm text-foreground'>
                            Send login credentials via email
                        </span>
                    </label>

                    {/* Actions */}
                    <div className='flex gap-2 justify-end pt-1'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setOpen(false)}
                            disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type='submit' disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2
                                        size={14}
                                        className='animate-spin mr-1.5'
                                    />
                                    Creating…
                                </>
                            ) : (
                                'Create user'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
