'use client';

import { updateSiteSettings, type SiteSettingsData } from '@/app/_actions/settingsActions';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScriptEditor } from './script-editor';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

type NullableSettings = {
    [K in keyof SiteSettingsData]: string | null | undefined;
} & { id?: string };

interface SettingsFormProps {
    settings: NullableSettings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const [isSaving, setIsSaving] = useState(false);

    // Google tab
    const [gaId, setGaId] = useState(settings?.googleAnalyticsId ?? '');
    const [gtmId, setGtmId] = useState(settings?.googleTagManagerId ?? '');
    const [siteVerification, setSiteVerification] = useState(
        settings?.googleSiteVerification ?? ''
    );

    // Meta tab
    const [pixelId, setPixelId] = useState(settings?.metaPixelId ?? '');

    // Scripts tab
    const [headScripts, setHeadScripts] = useState(settings?.headScripts ?? '');
    const [bodyStartScripts, setBodyStartScripts] = useState(
        settings?.bodyStartScripts ?? ''
    );
    const [bodyEndScripts, setBodyEndScripts] = useState(
        settings?.bodyEndScripts ?? ''
    );

    // Organization / AEO tab
    const [orgName, setOrgName] = useState(settings?.orgName ?? '');
    const [orgDescription, setOrgDescription] = useState(
        settings?.orgDescription ?? ''
    );
    const [orgUrl, setOrgUrl] = useState(settings?.orgUrl ?? '');
    const [orgPhone, setOrgPhone] = useState(settings?.orgPhone ?? '');
    const [orgEmail, setOrgEmail] = useState(settings?.orgEmail ?? '');
    const [orgAddress, setOrgAddress] = useState(settings?.orgAddress ?? '');
    const [orgLogoUrl, setOrgLogoUrl] = useState(settings?.orgLogoUrl ?? '');
    const [orgTwitter, setOrgTwitter] = useState(settings?.orgTwitter ?? '');
    const [orgLinkedin, setOrgLinkedin] = useState(settings?.orgLinkedin ?? '');
    const [orgFacebook, setOrgFacebook] = useState(settings?.orgFacebook ?? '');
    const [orgInstagram, setOrgInstagram] = useState(
        settings?.orgInstagram ?? ''
    );

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await updateSiteSettings({
                googleAnalyticsId: gaId || undefined,
                googleTagManagerId: gtmId || undefined,
                googleSiteVerification: siteVerification || undefined,
                metaPixelId: pixelId || undefined,
                headScripts: headScripts || undefined,
                bodyStartScripts: bodyStartScripts || undefined,
                bodyEndScripts: bodyEndScripts || undefined,
                orgName: orgName || undefined,
                orgDescription: orgDescription || undefined,
                orgUrl: orgUrl || undefined,
                orgPhone: orgPhone || undefined,
                orgEmail: orgEmail || undefined,
                orgAddress: orgAddress || undefined,
                orgLogoUrl: orgLogoUrl || undefined,
                orgTwitter: orgTwitter || undefined,
                orgLinkedin: orgLinkedin || undefined,
                orgFacebook: orgFacebook || undefined,
                orgInstagram: orgInstagram || undefined,
            });

            if (res.success) {
                toast.success('Settings saved successfully');
            } else {
                toast.error(res.error || 'Failed to save settings');
            }
        } catch {
            toast.error('Something went wrong while saving');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                <div>
                    <h2 className='text-xl font-semibold'>Site Settings</h2>
                    <p className='text-sm text-muted-foreground mt-0.5'>
                        Manage tracking codes, AEO schema, and custom scripts.
                    </p>
                </div>
                <Button
                    size='sm'
                    onClick={handleSave}
                    disabled={isSaving}
                    className='px-6 gap-2 self-start sm:self-auto'>
                    <IconDeviceFloppy size={18} />
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </Button>
            </div>

            <Tabs defaultValue='google'>
                <TabsList className='flex-wrap h-auto gap-1'>
                    <TabsTrigger value='google'>Google</TabsTrigger>
                    <TabsTrigger value='meta'>Meta / Facebook</TabsTrigger>

                    <TabsTrigger value='aeo'>AEO &amp; Schema</TabsTrigger>
                    <TabsTrigger value='scripts'>Custom Scripts</TabsTrigger>
                </TabsList>

                {/* ── Google ──────────────────────────────────── */}
                <TabsContent value='google' className='mt-4'>
                    <Card className='shadow-none border-border'>
                        <CardHeader>
                            <CardTitle className='text-base font-medium'>
                                Google Tracking
                            </CardTitle>
                            <CardDescription>
                                Enter your Google IDs. These override the
                                environment variable fallbacks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-5'>
                            <Field
                                id='ga-id'
                                label='Google Analytics ID'
                                placeholder='G-XXXXXXXXXX'
                                value={gaId}
                                onChange={setGaId}
                                hint='Measurement ID from your GA4 property.'
                            />
                            <Field
                                id='gtm-id'
                                label='Google Tag Manager ID'
                                placeholder='GTM-XXXXXXX'
                                value={gtmId}
                                onChange={setGtmId}
                                hint='Container ID from Google Tag Manager.'
                            />
                            <Field
                                id='site-verification'
                                label='Google Site Verification'
                                placeholder='XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
                                value={siteVerification}
                                onChange={setSiteVerification}
                                hint='Paste the content value from the meta tag Google provides.'
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Meta ──────────────────────────────────── */}
                <TabsContent value='meta' className='mt-4'>
                    <Card className='shadow-none border-border'>
                        <CardHeader>
                            <CardTitle className='text-base font-medium'>
                                Meta / Facebook Pixel
                            </CardTitle>
                            <CardDescription>
                                Enter your Pixel ID to enable Meta event
                                tracking and conversion optimisation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-5'>
                            <Field
                                id='pixel-id'
                                label='Meta Pixel ID'
                                placeholder='XXXXXXXXXXXXXXXX'
                                value={pixelId}
                                onChange={setPixelId}
                                hint='Found in Meta Events Manager → Data Sources.'
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Custom Scripts ──────────────────────────────────── */}
                <TabsContent value='scripts' className='mt-4'>
                    <Card className='shadow-none border-border'>
                        <CardHeader>
                            <CardTitle className='text-base font-medium'>
                                Custom Script Injection
                            </CardTitle>
                            <CardDescription>
                                Paste raw HTML (
                                <code className='text-xs bg-muted px-1 rounded'>
                                    &lt;script&gt;
                                </code>
                                ,{' '}
                                <code className='text-xs bg-muted px-1 rounded'>
                                    &lt;link&gt;
                                </code>
                                , etc.) into any position of the page. Useful
                                for third-party tools that are not natively
                                supported.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            <ScriptField
                                id='head-scripts'
                                label='Head Scripts'
                                badge='<head>'
                                value={headScripts}
                                onChange={setHeadScripts}
                                hint='Runs before page content loads. Good for critical third-party tags.'
                            />
                            <ScriptField
                                id='body-start-scripts'
                                label='Body Start Scripts'
                                badge='<body> start'
                                value={bodyStartScripts}
                                onChange={setBodyStartScripts}
                                hint='Injected at the very beginning of the body tag.'
                            />
                            <ScriptField
                                id='body-end-scripts'
                                label='Body End Scripts'
                                badge='</body> end'
                                value={bodyEndScripts}
                                onChange={setBodyEndScripts}
                                hint='Injected just before the closing body tag. Least impact on performance.'
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── AEO & Schema ──────────────────────────────────── */}
                <TabsContent value='aeo' className='mt-4 space-y-4'>
                    <Card className='shadow-none border-border'>
                        <CardHeader>
                            <CardTitle className='text-base font-medium'>
                                AEO &amp; JSON-LD Organisation Schema
                            </CardTitle>
                            <CardDescription>
                                This data is injected as{' '}
                                <code className='text-xs bg-muted px-1 rounded'>
                                    application/ld+json
                                </code>{' '}
                                structured data into every page. It helps AI
                                search engines (ChatGPT, Perplexity, Gemini) and
                                Google understand who WattUp is, what it does,
                                and how to contact you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-5'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                                <Field
                                    id='org-name'
                                    label='Organisation Name'
                                    placeholder='WattupUSA'
                                    value={orgName}
                                    onChange={setOrgName}
                                />
                                <Field
                                    id='org-url'
                                    label='Website URL'
                                    placeholder='https://wattupusa.com'
                                    value={orgUrl}
                                    onChange={setOrgUrl}
                                />
                                <Field
                                    id='org-phone'
                                    label='Phone'
                                    placeholder='+1-555-000-0000'
                                    value={orgPhone}
                                    onChange={setOrgPhone}
                                />
                                <Field
                                    id='org-email'
                                    label='Email'
                                    placeholder='info@wattupusa.com'
                                    value={orgEmail}
                                    onChange={setOrgEmail}
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label
                                    htmlFor='org-description'
                                    className='text-sm font-normal'>
                                    Description{' '}
                                    <span className='text-muted-foreground text-xs'>
                                        (used by AI engines to understand your
                                        business)
                                    </span>
                                </Label>
                                <Textarea
                                    id='org-description'
                                    placeholder='WattupUSA provides turnkey EV charging solutions for property owners, fleet operators, and drivers...'
                                    value={orgDescription}
                                    onChange={e =>
                                        setOrgDescription(e.target.value)
                                    }
                                    className='min-h-[100px] resize-none font-normal'
                                />
                            </div>

                            <Field
                                id='org-address'
                                label='Street Address'
                                placeholder='123 Main St, City, State'
                                value={orgAddress}
                                onChange={setOrgAddress}
                            />

                            <Field
                                id='org-logo'
                                label='Logo URL'
                                placeholder='https://wattupusa.com/assets/images/shared/logo.svg'
                                value={orgLogoUrl}
                                onChange={setOrgLogoUrl}
                                hint='Full URL to the logo image. Used in search results.'
                            />
                        </CardContent>
                    </Card>

                    <Card className='shadow-none border-border'>
                        <CardHeader>
                            <CardTitle className='text-base font-medium'>
                                Social Profiles
                            </CardTitle>
                            <CardDescription>
                                These URLs are added to the{' '}
                                <code className='text-xs bg-muted px-1 rounded'>
                                    sameAs
                                </code>{' '}
                                property in the schema, helping search engines
                                and AI link your social presence to your
                                business entity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                            <Field
                                id='org-twitter'
                                label='Twitter / X'
                                placeholder='https://x.com/wattupusa'
                                value={orgTwitter}
                                onChange={setOrgTwitter}
                            />
                            <Field
                                id='org-linkedin'
                                label='LinkedIn'
                                placeholder='https://linkedin.com/company/wattup'
                                value={orgLinkedin}
                                onChange={setOrgLinkedin}
                            />
                            <Field
                                id='org-facebook'
                                label='Facebook'
                                placeholder='https://facebook.com/wattupusa'
                                value={orgFacebook}
                                onChange={setOrgFacebook}
                            />
                            <Field
                                id='org-instagram'
                                label='Instagram'
                                placeholder='https://instagram.com/wattupusa'
                                value={orgInstagram}
                                onChange={setOrgInstagram}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function Field({
    id,
    label,
    placeholder,
    value,
    onChange,
    hint,
}: {
    id: string;
    label: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
}) {
    return (
        <div className='space-y-1.5'>
            <Label htmlFor={id} className='text-sm font-normal'>
                {label}
            </Label>
            <Input
                id={id}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className='h-10'
            />
            {hint && (
                <p className='text-xs text-muted-foreground'>{hint}</p>
            )}
        </div>
    );
}

function ScriptField({
    id,
    label,
    badge,
    value,
    onChange,
    hint,
}: {
    id: string;
    label: string;
    badge: string;
    value: string;
    onChange: (v: string) => void;
    hint?: string;
}) {
    return (
        <div className='space-y-1.5'>
            <div className='flex items-center gap-2'>
                <Label htmlFor={id} className='text-sm font-normal'>
                    {label}
                </Label>
                <span className='text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border'>
                    {badge}
                </span>
            </div>
            <ScriptEditor value={value} onChange={onChange} />
            {hint && (
                <p className='text-xs text-muted-foreground'>{hint}</p>
            )}
        </div>
    );
}


