'use client';
import { updateSocialLinks } from '@/app/_actions/userActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SocialLinkData {
    id: string;
    name: string;
    url: string;
}

interface SocialLinksProps {
    initialLinks: SocialLinkData[];
}

const SocialLinks = ({ initialLinks }: SocialLinksProps) => {
    const [links, setLinks] = useState<{ [key: string]: string }>(() => {
        const initialState: { [key: string]: string } = {
            LinkedIn: '',
            Twitter: '',
            Instagram: '',
        };
        initialLinks.forEach(link => {
            if (initialState.hasOwnProperty(link.name)) {
                initialState[link.name] = link.url;
            }
        });
        return initialState;
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const linksArray = Object.entries(links).map(([name, url]) => ({
            name,
            url,
        }));
        const res = await updateSocialLinks(linksArray);
        setIsSaving(false);

        if (res.success) {
            toast.success('Social links updated');
        } else {
            toast.error('Failed to update social links');
        }
    };

    const handleChange = (name: string, url: string) => {
        setLinks(prev => ({ ...prev, [name]: url }));
    };

    return (
        <Card className='shadow-none border-border'>
            <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-4'>
                <CardTitle className='text-lg font-semibold'>
                    Social Links
                </CardTitle>
                <Button
                    size='sm'
                    onClick={handleSave}
                    disabled={isSaving}
                    className='gap-2 px-6'>
                    <IconDeviceFloppy size={22} />
                    {isSaving ? 'Saving...' : 'Save Links'}
                </Button>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='space-y-2'>
                    <Label htmlFor='linkedin'>LinkedIn URL</Label>
                    <Input
                        id='linkedin'
                        placeholder='https://linkedin.com/in/...'
                        value={links['LinkedIn']}
                        onChange={e => handleChange('LinkedIn', e.target.value)}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='twitter'>Twitter/X URL</Label>
                    <Input
                        id='twitter'
                        placeholder='https://twitter.com/...'
                        value={links['Twitter']}
                        onChange={e => handleChange('Twitter', e.target.value)}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='instagram'>Instagram URL</Label>
                    <Input
                        id='instagram'
                        placeholder='https://instagram.com/...'
                        value={links['Instagram']}
                        onChange={e => handleChange('Instagram', e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default SocialLinks;

