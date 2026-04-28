'use client';

import {
    removeProfilePhoto,
    updateUserInformationById,
    uploadProfilePhoto,
} from '@/app/_actions/userActions';

import { AnimatedProgress } from '@/components/common/animate-progress';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ImageCropper from './image-cropper';

const MAX_SIZE_MB = 5;

interface UserImage {
    url: string;
    public_id: string;
}

interface UserProfile {
    id: string;
    image?: string | UserImage;
}

interface ProfilePhotoSectionProps {
    user: UserProfile;
}

const ProfilePhotoSection = ({ user }: ProfilePhotoSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentPhoto, setCurrentPhoto] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');

    const [error, setError] = useState<string>('');
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [openCropper, setOpenCropper] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            let imageUrl = '';
            if (typeof user.image === 'string') {
                imageUrl = user.image;
            } else if (
                user.image &&
                typeof user.image === 'object' &&
                user.image.url
            ) {
                imageUrl = user.image.url;
            }

            if (imageUrl) {
                setCurrentPhoto(imageUrl);
            } else {
                setCurrentPhoto('');
            }
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setError('File too large. Max size is 5MB.');
            return;
        }

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            setError('Invalid format. Only PNG, JPG, or WEBP allowed.');
            return;
        }

        const url = URL.createObjectURL(file);
        setTempPhotoUrl(url);
        setOpenCropper(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropperClose = () => {
        setTempPhotoUrl('');
        setOpenCropper(false);
        setSelectedFile(null);
        setError('');
    };

    const handleCropComplete = async (file: File, blobUrl: string) => {
        setSelectedFile(file);
        setCurrentPhoto(blobUrl);
        setOpenCropper(false);

        const userId = user.id;

        if (file && userId) {
            setUploading(true);
            setUploadProgress(0);

            try {
                // Simulate progressive progress while server action works
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
                        typeof user?.image === 'object' &&
                        user?.image?.public_id
                            ? user.image.public_id
                            : null;

                    if (publicId) {
                        try {
                            await removeProfilePhoto(publicId);
                        } catch (err) {
                            console.error('Failed to remove old photo:', err);
                        }
                    }

                    await updateUserInformationById(userId, {
                        image: {
                            url: uploadRes.url,
                            public_id: uploadRes.publicId,
                        },
                    });

                    setCurrentPhoto(uploadRes.url);
                    setSelectedFile(null);
                    toast.success('Profile photo updated');
                } else {
                    const errMsg =
                        uploadRes.error || 'Failed to upload. Try again.';
                    setError(errMsg);
                    toast.error(errMsg);
                }
            } catch (err) {
                console.error('Something went wrong:', err);
                setError('Something went wrong.');
                toast.error('Something went wrong');
            } finally {
                setTimeout(() => {
                    setUploading(false);
                    setUploadProgress(0);
                }, 500);
            }
        }
    };

    return (
        <div className='flex w-full flex-col lg:flex-row gap-8 bg-card border border-border p-6 rounded-xl shadow-sm overflow-hidden'>
            {/* Left Section */}
            <div className='flex lg:w-1/2 w-full pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0'>
                <div className='flex items-center gap-6 w-full'>
                    {/* Avatar with Progress Overlay */}
                    <div className='relative group'>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className='relative w-32 h-32 rounded-full bg-muted shadow-md overflow-hidden ring-4 ring-border/50 group-hover:ring-primary/20 transition-all duration-300'>
                            <Image
                                src={
                                    currentPhoto ||
                                    'https://github.com/shadcn.png'
                                }
                                alt='Profile'
                                fill
                                sizes='128px'
                                quality={90}
                                className='object-cover'
                            />

                            {/* Tiptap-style Upload Progress Overlay */}
                            <AnimatePresence>
                                {uploading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className='absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-4'>
                                        <div className='w-full space-y-2'>
                                            <AnimatedProgress
                                                target={uploadProgress}
                                                className='h-1.5'
                                            />
                                            <p className='text-[10px] font-bold text-center text-primary uppercase tracking-wider'>
                                                Uploading...
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Controls */}
                    <div className='flex flex-col gap-3 flex-1'>
                        <div className='space-y-1'>
                            <h4 className='text-sm font-semibold text-foreground'>
                                Avatar Image
                            </h4>
                            <p className='text-xs text-muted-foreground'>
                                Help people recognize you easily.
                            </p>
                        </div>

                        <input
                            type='file'
                            accept='image/png, image/jpeg, image/webp'
                            className='hidden'
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        <div className='flex items-center gap-2'>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className='gap-2 h-9 border-border hover:bg-muted font-medium'>
                                <Upload className='w-3.5 h-3.5' />
                                Change Photo
                            </Button>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className='text-[11px] font-semibold text-destructive mt-1 bg-destructive/5 py-1 px-2 rounded-md border border-destructive/10 inline-block'>
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <ImageCropper
                open={openCropper}
                imageSrc={tempPhotoUrl || ''}
                onClose={handleCropperClose}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

export default ProfilePhotoSection;

