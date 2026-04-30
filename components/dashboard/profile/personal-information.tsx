/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import {
    removeProfilePhoto,
    updateUserInformationById,
    uploadProfilePhoto,
} from '@/app/_actions/userActions';
import { AnimatedProgress } from '@/components/common/animate-progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { UploadIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ImageCropper from './image-cropper';

interface PersonalInformationProps {
    profile: {
        id: string;
        name: string;
        bio: string;
        image?: any;
    };
}

const MAX_SIZE_MB = 5;

const PersonalInformation = ({ profile }: PersonalInformationProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState(profile.name);
    const [bio, setBio] = useState(profile.bio);
    const [currentPhoto, setCurrentPhoto] = useState<string>('');
    const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');

    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [openCropper, setOpenCropper] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setBio(profile.bio);

            let imageUrl = '';
            if (typeof profile.image === 'string') {
                imageUrl = profile.image;
            } else if (
                profile.image &&
                typeof profile.image === 'object' &&
                profile.image.url
            ) {
                imageUrl = profile.image.url;
            }
            setCurrentPhoto(imageUrl);
        }
    }, [profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error('File too large. Max size is 5MB.');
            return;
        }

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            toast.error('Invalid format. Only PNG, JPG, or WEBP allowed.');
            return;
        }

        const url = URL.createObjectURL(file);
        setTempPhotoUrl(url);
        setOpenCropper(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropComplete = async (file: File, blobUrl: string) => {
        setCurrentPhoto(blobUrl);
        setOpenCropper(false);

        if (file && profile.id) {
            setUploading(true);
            setUploadProgress(0);

            try {
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 95) {
                            clearInterval(progressInterval);
                            return 95;
                        }
                        return prev + 5;
                    });
                }, 100);

                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await uploadProfilePhoto(formData);

                clearInterval(progressInterval);
                setUploadProgress(100);

                if (uploadRes.success && uploadRes.url && uploadRes.publicId) {
                    const publicId =
                        typeof profile?.image === 'object' &&
                        profile?.image?.public_id
                            ? profile.image.public_id
                            : null;

                    if (publicId) {
                        try {
                            await removeProfilePhoto(publicId);
                        } catch (err) {
                            console.error('Failed to remove old photo:', err);
                        }
                    }

                    await updateUserInformationById(profile.id, {
                        image: {
                            url: uploadRes.url,
                            public_id: uploadRes.publicId,
                        },
                    });

                    setCurrentPhoto(uploadRes.url);
                    toast.success('Profile photo updated');
                } else {
                    toast.error(uploadRes.error || 'Upload failed');
                }
            } catch (err) {
                console.error('Upload error:', err);
                toast.error('Something went wrong during upload');
            } finally {
                setTimeout(() => {
                    setUploading(false);
                    setUploadProgress(0);
                }, 500);
            }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateUserInformationById(profile.id, {
                name,
                bio,
            });

            if (res.success) {
                toast.success('Personal information updated');
            } else {
                toast.error(res.error || 'Failed to update');
            }
        } catch {
            toast.error('Something went wrong while saving');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className='shadow-none border-border'>
            <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-4'>
                <CardTitle className=' text-lg font-medium'>
                    Personal Information
                </CardTitle>
                <Button
                    size='sm'
                    onClick={handleSave}
                    disabled={isSaving || uploading}
                    className='px-6 gap-2'>
                    <IconDeviceFloppy size={22} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='flex flex-wrap items-center gap-4'>
                    <div className='relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted'>
                        {currentPhoto ? (
                            <Image
                                src={currentPhoto}
                                alt='Profile'
                                fill
                                className='object-cover'
                                unoptimized
                            />
                        ) : (
                            <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    viewBox='0 0 24 24'
                                    fill='currentColor'
                                    className='w-10 h-10 opacity-40'>
                                    <path
                                        fillRule='evenodd'
                                        d='M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </div>
                        )}
                        <AnimatePresence>
                            {uploading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className='absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-2'>
                                    <div className='w-full space-y-1'>
                                        <AnimatedProgress
                                            target={uploadProgress}
                                            className='h-1'
                                        />
                                        <p className='text-[8px] font-bold text-center text-primary uppercase'>
                                            Uploading
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <Button
                        variant='outline'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className='h-9 font-normal border border-dashed bg-primary/5 text-sm w-fit px-5 hover:border-solid hover:bg-primary'>
                        <UploadIcon size={12} />
                        Change Photo
                    </Button>
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='name' className='text-sm font-normal'>
                        Name
                    </Label>
                    <Input
                        id='name'
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className='h-10'
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='bio' className='text-sm font-normal'>
                        Bio (Short)
                    </Label>
                    <Textarea
                        id='bio'
                        placeholder='Short bio for the sidebar...'
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className='min-h-[100px] resize-none'
                    />
                </div>
            </CardContent>

            <ImageCropper
                open={openCropper}
                imageSrc={tempPhotoUrl || ''}
                onClose={() => setOpenCropper(false)}
                onCropComplete={handleCropComplete}
            />
        </Card>
    );
};

export default PersonalInformation;

