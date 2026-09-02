/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { updateEmail, updatePassword } from '@/app/_actions/auth-actions';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface EmailUpdateFormData {
    currentPassword: string;
    newEmail: string;
}

interface PasswordUpdateFormData {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

export default function CredentialsUpdate() {
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const emailForm = useForm<EmailUpdateFormData>();
    const passwordForm = useForm<PasswordUpdateFormData>();

    const onEmailSubmit = async (formData: EmailUpdateFormData) => {
        try {
            setIsEmailLoading(true);
            const data = new FormData();
            data.append('currentPassword', formData.currentPassword);
            data.append('newEmail', formData.newEmail);

            const result = await updateEmail(data);

            if (result.success) {
                toast.success(result.message || 'Email updated successfully');
                emailForm.reset();
            } else {
                toast.error(result.error || 'Failed to update email');
            }
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred');
        } finally {
            setIsEmailLoading(false);
        }
    };

    const onPasswordSubmit = async (formData: PasswordUpdateFormData) => {
        if (formData.newPassword !== formData.confirmNewPassword) {
            passwordForm.setError('confirmNewPassword', {
                message: 'Passwords do not match',
            });
            return;
        }

        try {
            setIsPasswordLoading(true);
            const data = new FormData();
            data.append('currentPassword', formData.currentPassword);
            data.append('newPassword', formData.newPassword);
            data.append('confirmNewPassword', formData.confirmNewPassword);

            const result = await updatePassword(data);

            if (result.success) {
                toast.success(
                    result.message || 'Password updated successfully'
                );
                passwordForm.reset();
            } else {
                toast.error(result.error || 'Failed to update password');
            }
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className='grid gap-6 md:grid-cols-2'>
            {/* ── Password Update Card ── */}
            <Card className='dash-card flex h-full flex-col shadow-none'>
                <CardHeader>
                    <CardTitle className='text-[15px] font-semibold text-dash-heading'>
                        Change Password
                    </CardTitle>
                    <CardDescription className='mt-1'>
                        Use a long, random password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent className='flex-1'>
                    <form
                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                        className='space-y-4'>
                        {/* Current password */}
                        <div className='space-y-2'>
                            <Label htmlFor='password-current-password'>
                                Current Password
                            </Label>
                            <Input
                                {...passwordForm.register('currentPassword', {
                                    required: 'Current password is required',
                                })}
                                type='password'
                                id='password-current-password'
                                autoComplete='current-password'
                                placeholder='••••••••'
                            />
                            {passwordForm.formState.errors.currentPassword && (
                                <p className='text-destructive text-xs mt-1'>
                                    {
                                        passwordForm.formState.errors
                                            .currentPassword.message
                                    }
                                </p>
                            )}
                        </div>

                        {/* New password */}
                        <div className='space-y-2'>
                            <Label htmlFor='newPassword'>New Password</Label>
                            <Input
                                {...passwordForm.register('newPassword', {
                                    required: 'New password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Minimum 8 characters',
                                    },
                                })}
                                type='password'
                                id='newPassword'
                                autoComplete='new-password'
                                placeholder='Min. 8 characters'
                            />
                            {passwordForm.formState.errors.newPassword && (
                                <p className='text-destructive text-xs mt-1'>
                                    {
                                        passwordForm.formState.errors
                                            .newPassword.message
                                    }
                                </p>
                            )}
                        </div>

                        {/* Confirm new password */}
                        <div className='space-y-2'>
                            <Label htmlFor='confirmNewPassword'>
                                Confirm New Password
                            </Label>
                            <Input
                                {...passwordForm.register(
                                    'confirmNewPassword',
                                    {
                                        required:
                                            'Please confirm your new password',
                                        validate: val =>
                                            val ===
                                                passwordForm.getValues(
                                                    'newPassword'
                                                ) || 'Passwords do not match',
                                    }
                                )}
                                type='password'
                                id='confirmNewPassword'
                                autoComplete='new-password'
                                placeholder='Re-enter password'
                            />
                            {passwordForm.formState.errors
                                .confirmNewPassword && (
                                <p className='text-destructive text-xs mt-1'>
                                    {
                                        passwordForm.formState.errors
                                            .confirmNewPassword.message
                                    }
                                </p>
                            )}
                        </div>

                        <div className='flex justify-end pt-1'>
                            <Button type='submit' size='sm' disabled={isPasswordLoading}>
                                {isPasswordLoading ? 'Updating...' : 'Update password'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* ── Email Update Card ──
                The form, the handler and the updateEmail action all existed; only this
                card was missing, which is why the grid beside Change Password was empty
                and why a working feature was unreachable. */}
            <Card className='dash-card flex h-full flex-col shadow-none'>
                <CardHeader>
                    <CardTitle className='text-[15px] font-semibold text-dash-heading'>
                        Change Email
                    </CardTitle>
                    <CardDescription className='mt-1'>
                        You sign in with this address, so it is confirmed with your
                        password before it changes.
                    </CardDescription>
                </CardHeader>
                <CardContent className='flex-1'>
                    <form
                        onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                        className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='email-new-email'>New Email</Label>
                            <Input
                                {...emailForm.register('newEmail', {
                                    required: 'A new email address is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Enter a valid email address',
                                    },
                                })}
                                type='email'
                                id='email-new-email'
                                autoComplete='email'
                                placeholder='you@example.com'
                            />
                            {emailForm.formState.errors.newEmail && (
                                <p className='mt-1 text-xs text-destructive'>
                                    {emailForm.formState.errors.newEmail.message}
                                </p>
                            )}
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='email-current-password'>
                                Current Password
                            </Label>
                            <Input
                                {...emailForm.register('currentPassword', {
                                    required: 'Current password is required',
                                })}
                                type='password'
                                id='email-current-password'
                                autoComplete='current-password'
                                placeholder='••••••••'
                            />
                            {emailForm.formState.errors.currentPassword && (
                                <p className='mt-1 text-xs text-destructive'>
                                    {
                                        emailForm.formState.errors.currentPassword
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        <div className='flex justify-end pt-1'>
                            <Button type='submit' size='sm' disabled={isEmailLoading}>
                                {isEmailLoading ? 'Updating...' : 'Update email'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

