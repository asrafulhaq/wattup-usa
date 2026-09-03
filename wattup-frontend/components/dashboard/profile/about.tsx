'use client';
import { updateUserInformationById } from '@/app/_actions/userActions';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

/**
 * The same split as the article editor: TipTap and ProseMirror are 186 KB gzipped and
 * this is the second route that mounts them, so /dashboard/profile was carrying the
 * whole editor in its initial JS to draw an About box most visits never touch.
 */
const SimpleEditor = dynamic(
    () => import('@/components/tiptap-templates/simple/simple-editor').then(m => m.SimpleEditor),
    {
        ssr: false,
        loading: () => (
            <div className='space-y-2'>
                <Skeleton className='h-11 w-full rounded-md' />
                <Skeleton className='h-[320px] w-full rounded-md' />
            </div>
        ),
    }
);

interface AboutProps {
    profile: {
        id: string;
        about: string;
    };
}

const About = ({ profile }: AboutProps) => {
    const [about, setAbout] = useState(profile.about || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateUserInformationById(profile.id, {
            about,
        });
        setIsSaving(false);

        if (res.success) {
            toast.success('About section updated');
        } else {
            toast.error(res.error || 'Failed to update about section');
        }
    };

    return (
        <Card className='md:col-span-2 shadow-none border-border'>
            <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-4'>
                <div>
                    <CardTitle className='text-lg font-medium'>
                        About Section
                    </CardTitle>
                    <CardDescription>
                        Write a detailed bio for your about page.
                    </CardDescription>
                </div>
                <Button
                    size='sm'
                    onClick={handleSave}
                    disabled={isSaving}
                    className='gap-2 px-6'>
                    <IconDeviceFloppy size={22} />
                    {isSaving ? 'Saving...' : 'Save About'}
                </Button>
            </CardHeader>
            <CardContent>
                <div className='space-y-2'>
                    <Label className='sr-only' htmlFor='about'>
                        About Content
                    </Label>
                    <Suspense fallback={null}>
                        <SimpleEditor
                            value={about}
                            onChange={setAbout}
                            placeholder='Write your detailed about section here...'
                        />
                    </Suspense>
                </div>
            </CardContent>
        </Card>
    );
};

export default About;

