'use client';

import type { DashboardAmenity } from '@/lib/locations/dashboard';
import {
    createLocation,
    geocodeLocationAddress,
    suggestLocationSlug,
    updateLocation,
    type GeocodeResult,
} from '@/app/_actions/locationActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { amenityIcon } from '@/lib/locations/amenities';
import { ImageUploadField } from '@/components/dashboard/ui/image-upload-field';
import {
    defaultMetaDescription,
    defaultMetaTitle,
} from '@/lib/locations/public';
import {
    CONNECTOR_TYPES,
    type LocationInput,
} from '@/lib/validations/location';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { Loader2, MapPin, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { STATUS_OPTIONS } from './status';

/**
 * The one form behind both create and edit.
 *
 * Numbers are held as strings while typing. Storing them as numbers means a field cannot
 * be cleared without becoming NaN, which then renders as "NaN" and saves as one; the
 * conversion happens once, at submit, where a bad value can be reported properly.
 */
type NumericField =
    | 'latitude'
    | 'longitude'
    | 'goLiveYear'
    | 'maxPowerKw'
    | 'chargerCount'
    | 'pricePerKwh'
    | 'signedNumber'
    | 'siteScore'
    | 'switchgearCount';

type FormState = Omit<LocationInput, NumericField | 'switchgearOrderedDate'> &
    Record<NumericField, string> & { switchgearOrderedDate: string };

interface Props {
    /** Absent when creating. */
    location?: LocationInput & { id: string };
    amenities: DashboardAmenity[];
}

const EMPTY: FormState = {
    slug: '',
    name: '',
    street: '',
    city: '',
    region: 'CA',
    postalCode: '',
    country: 'US',
    latitude: '',
    longitude: '',
    market: 'us-ca',
    status: 'PLANNED',
    goLiveYear: String(new Date().getFullYear() + 1),
    county: '',
    countyFips: '',
    // The client specified 310kW across the network, so a new site starts there rather
    // than at zero, which nobody would mean.
    maxPowerKw: '310',
    chargerCount: '0',
    pricePerKwh: '',
    published: true,
    metaTitle: null,
    metaDescription: null,
    imageUrl: null,
    imagePublicId: null,
    noIndex: false,
    amenities: [],
    connectors: [],
    signedNumber: '',
    initialNotes: '',
    pipelineRef: '',
    company: '',
    addressRaw: '',
    noticeAddress: '',
    apn: '',
    siteScore: '',
    switchgearCount: '',
    switchgearOrderedDate: '',
    salesRep: '',
};

function toFormState(location: LocationInput): FormState {
    const text = (value: number | null) => (value === null ? '' : String(value));
    return {
        ...location,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        goLiveYear: String(location.goLiveYear),
        maxPowerKw: String(location.maxPowerKw),
        chargerCount: String(location.chargerCount),
        pricePerKwh: text(location.pricePerKwh),
        signedNumber: text(location.signedNumber),
        siteScore: text(location.siteScore),
        switchgearCount: text(location.switchgearCount),
        switchgearOrderedDate: location.switchgearOrderedDate ?? '',
    };
}

/** Blank means "not set" for a nullable field, and NaN for a required one, which zod rejects. */
const optionalNumber = (value: string) =>
    value.trim() === '' ? null : Number(value);
const requiredNumber = (value: string) =>
    value.trim() === '' ? Number.NaN : Number(value);

/** Fields a person can blank, where "Expected number, received nan" would not help. */
const REQUIRED_NUMBERS: { key: NumericField; label: string }[] = [
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'goLiveYear', label: 'Go live year' },
    { key: 'maxPowerKw', label: 'Peak power' },
    { key: 'chargerCount', label: 'Charging bays' },
];

export function LocationForm({ location, amenities }: Props) {
    const router = useRouter();
    const [state, setState] = useState<FormState>(
        location ? toFormState(location) : EMPTY
    );
    const [isSaving, startSaving] = useTransition();
    const [geocoding, setGeocoding] = useState(false);
    const [candidate, setCandidate] = useState<GeocodeResult | null>(null);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setState(current => ({ ...current, [key]: value }));

    const connectorCount = (type: (typeof CONNECTOR_TYPES)[number]) =>
        state.connectors.find(connector => connector.type === type)?.count ?? 0;

    const setConnectorCount = (
        type: (typeof CONNECTOR_TYPES)[number],
        raw: string
    ) => {
        const count = Number(raw);
        const next = state.connectors.filter(connector => connector.type !== type);
        if (Number.isFinite(count) && count > 0) next.push({ type, count });
        set('connectors', next);
    };

    const toggleAmenity = (slug: string) =>
        set(
            'amenities',
            state.amenities.includes(slug)
                ? state.amenities.filter(id => id !== slug)
                : [...state.amenities, slug]
        );

    // Built from the same helpers generateMetadata uses, so the preview cannot show one
    // thing while the page emits another.
    const metaInput = {
        street: state.street,
        city: state.city,
        region: state.region,
        postalCode: state.postalCode,
        maxPowerKw: Number(state.maxPowerKw) || 0,
        chargerCount: Number(state.chargerCount) || 0,
        status: state.status,
    };
    const generatedTitle = defaultMetaTitle(metaInput);
    const generatedDescription = defaultMetaDescription(metaInput);
    const siteOrigin = (
        process.env.NEXT_PUBLIC_APP_URL || 'https://wattupusa.com'
    ).replace(/\/$/, '');

    const addressLine = [
        state.street,
        state.city,
        state.region,
        state.postalCode,
        state.country,
    ]
        .filter(Boolean)
        .join(', ');

    const onLocate = async () => {
        setGeocoding(true);
        setCandidate(null);
        const result = await geocodeLocationAddress(addressLine);
        setGeocoding(false);
        if (result.success) {
            setCandidate(result.result);
        } else {
            toast.error(result.error);
        }
    };

    const applyCandidate = () => {
        if (!candidate) return;
        setState(current => ({
            ...current,
            latitude: String(candidate.latitude),
            longitude: String(candidate.longitude),
            addressRaw: candidate.label,
        }));
        setCandidate(null);
        toast.success('Coordinates applied. Save to keep them.');
    };

    const onSuggestSlug = async () => {
        const result = await suggestLocationSlug(state.name, state.city);
        if ('slug' in result && result.slug) {
            set('slug', result.slug);
        } else if ('error' in result) {
            toast.error(result.error);
        }
    };

    const onSubmit = () => {
        const blank = REQUIRED_NUMBERS.find(field => state[field.key].trim() === '');
        if (blank) {
            toast.error(`${blank.label} is required.`);
            return;
        }

        const payload = {
            ...state,
            latitude: requiredNumber(state.latitude),
            longitude: requiredNumber(state.longitude),
            goLiveYear: requiredNumber(state.goLiveYear),
            maxPowerKw: requiredNumber(state.maxPowerKw),
            chargerCount: requiredNumber(state.chargerCount),
            pricePerKwh: optionalNumber(state.pricePerKwh),
            signedNumber: optionalNumber(state.signedNumber),
            siteScore: optionalNumber(state.siteScore),
            switchgearCount: optionalNumber(state.switchgearCount),
            switchgearOrderedDate:
                state.switchgearOrderedDate.trim() === ''
                    ? null
                    : state.switchgearOrderedDate,
        };

        startSaving(async () => {
            const result = location
                ? await updateLocation(location.id, payload)
                : await createLocation(payload);

            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(location ? 'Location saved' : 'Location created');
            router.push('/dashboard/locations');
            router.refresh();
        });
    };

    return (
        <div className='flex flex-col gap-4'>
            {/* Sticky: the form is five tabs deep and the internal one is long, so a
                Save button pinned to the top of the document is off screen exactly when
                someone has finished typing and wants it. */}
            <div className='sticky top-(--header-height) z-10 -mx-4 flex items-center justify-end gap-3 border-b border-dash-border bg-dash-canvas/85 px-4 py-3 backdrop-blur-sm md:-mx-8 md:px-8'>
                <Button variant='outline' onClick={() => router.back()} disabled={isSaving}>
                    Cancel
                </Button>
                <Button onClick={onSubmit} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className='size-4 animate-spin' />
                    ) : (
                        <IconDeviceFloppy className='size-4' />
                    )}
                    {location ? 'Save changes' : 'Create location'}
                </Button>
            </div>

            <Tabs defaultValue='site'>
                <TabsList className='h-10 rounded-[10px] border border-dash-border bg-dash-surface p-1'>
                    <TabsTrigger value='site'>Site</TabsTrigger>
                    <TabsTrigger value='address'>Address</TabsTrigger>
                    <TabsTrigger value='charging'>Charging</TabsTrigger>
                    <TabsTrigger value='amenities'>
                        Amenities
                        {state.amenities.length > 0 && ` (${state.amenities.length})`}
                    </TabsTrigger>
                    <TabsTrigger value='seo'>Search</TabsTrigger>
                    <TabsTrigger value='internal'>Internal</TabsTrigger>
                </TabsList>

                {/* ── Site ─────────────────────────────────────────────────── */}
                <TabsContent value='site' className='mt-4'>
                    <Section
                        title='Site'
                        description='What a driver sees first: the name on the card, and whether they can charge there.'>
                        <Field label='Name' hint='Shown on the map card and the station page.'>
                            <Input
                                value={state.name}
                                onChange={event => set('name', event.target.value)}
                                placeholder='WattUp Redlands'
                            />
                        </Field>

                        <Field
                            label='URL slug'
                            hint={`The public address: /locations/${state.slug || '…'}. Changing it breaks existing links.`}>
                            <div className='flex gap-2'>
                                <Input
                                    value={state.slug}
                                    onChange={event => set('slug', event.target.value)}
                                    placeholder='redlands-1405-w-colton-ave'
                                />
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={onSuggestSlug}
                                    title='Suggest from the name and city'>
                                    <Wand2 className='size-4' />
                                </Button>
                            </div>
                        </Field>

                        <Field
                            label='Status'
                            hint='What the chip reads. Open means a driver can charge there today.'>
                            <Select
                                value={state.status}
                                onValueChange={value =>
                                    set('status', value as FormState['status'])
                                }>
                                <SelectTrigger className='w-full'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label='Go live year' hint='The funded install year. Used by the availability filter.'>
                            <Input
                                inputMode='numeric'
                                value={state.goLiveYear}
                                onChange={event => set('goLiveYear', event.target.value)}
                            />
                        </Field>

                        <Field label='Charging bays' hint='How many charging points on site.'>
                            <Input
                                inputMode='numeric'
                                value={state.chargerCount}
                                onChange={event => set('chargerCount', event.target.value)}
                            />
                        </Field>

                        <Field label='Peak power (kW)' hint='310 across the network unless this site differs.'>
                            <Input
                                inputMode='numeric'
                                value={state.maxPowerKw}
                                onChange={event => set('maxPowerKw', event.target.value)}
                            />
                        </Field>

                        <div className='flex items-center justify-between gap-4 rounded-[10px] border border-dash-border bg-dash-canvas/60 p-4 sm:col-span-2'>
                            <div>
                                <Label className='text-sm font-medium'>Show on the public site</Label>
                                <p className='mt-1 text-xs text-muted-foreground'>
                                    Off hides it from the map, the list and its own page, and keeps
                                    the record and everything set here.
                                </p>
                            </div>
                            <Switch
                                checked={state.published}
                                onCheckedChange={next => set('published', next)}
                            />
                        </div>
                    </Section>
                </TabsContent>

                {/* ── Address ──────────────────────────────────────────────── */}
                <TabsContent value='address' className='mt-4'>
                    <Section
                        title='Address'
                        description='Coordinates place the pin on the map, and every site has been geocoded to street level. Change the address and use Locate to move the pin with it.'>
                        <Field label='Street'>
                            <Input
                                value={state.street}
                                onChange={event => set('street', event.target.value)}
                                placeholder='1405 W. Colton Ave.'
                            />
                        </Field>
                        <Field label='City'>
                            <Input
                                value={state.city}
                                onChange={event => set('city', event.target.value)}
                            />
                        </Field>
                        <Field label='State or region'>
                            <Input
                                value={state.region}
                                onChange={event => set('region', event.target.value)}
                            />
                        </Field>
                        <Field label='Postal code'>
                            <Input
                                value={state.postalCode}
                                onChange={event => set('postalCode', event.target.value)}
                            />
                        </Field>
                        <Field label='Country' hint='Two letter code.'>
                            <Input
                                value={state.country}
                                maxLength={2}
                                onChange={event =>
                                    set('country', event.target.value.toUpperCase())
                                }
                            />
                        </Field>
                        <Field label='Market' hint='Groups sites by network, for example us-ca.'>
                            <Input
                                value={state.market}
                                onChange={event => set('market', event.target.value)}
                            />
                        </Field>
                        <Field label='County'>
                            <Input
                                value={state.county}
                                onChange={event => set('county', event.target.value)}
                            />
                        </Field>
                        <Field label='County FIPS'>
                            <Input
                                value={state.countyFips}
                                onChange={event => set('countyFips', event.target.value)}
                            />
                        </Field>

                        <Field label='Latitude'>
                            <Input
                                inputMode='decimal'
                                value={state.latitude}
                                onChange={event => set('latitude', event.target.value)}
                            />
                        </Field>
                        <Field label='Longitude'>
                            <Input
                                inputMode='decimal'
                                value={state.longitude}
                                onChange={event => set('longitude', event.target.value)}
                            />
                        </Field>

                        <div className='rounded-[10px] border border-dash-border bg-dash-canvas/60 p-4 sm:col-span-2'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div>
                                    <Label className='text-sm font-medium'>
                                        Find the coordinates
                                    </Label>
                                    <p className='mt-1 text-xs text-muted-foreground'>
                                        Looks up the address above. Nothing changes until you
                                        apply it.
                                    </p>
                                </div>
                                <Button
                                    type='button'
                                    variant='outline'
                                    onClick={onLocate}
                                    disabled={geocoding}>
                                    {geocoding ? (
                                        <Loader2 className='size-4 animate-spin' />
                                    ) : (
                                        <MapPin className='size-4' />
                                    )}
                                    Locate
                                </Button>
                            </div>

                            {candidate && (
                                <div className='mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-primary/30 bg-primary/5 p-3'>
                                    <div className='text-sm'>
                                        <div className='font-medium'>{candidate.label}</div>
                                        <div className='text-xs text-muted-foreground tabular-nums'>
                                            {candidate.latitude.toFixed(6)},{' '}
                                            {candidate.longitude.toFixed(6)}
                                        </div>
                                    </div>
                                    <div className='flex gap-2'>
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            onClick={() => setCandidate(null)}>
                                            Discard
                                        </Button>
                                        <Button type='button' onClick={applyCandidate}>
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>
                </TabsContent>

                {/* ── Charging ─────────────────────────────────────────────── */}
                <TabsContent value='charging' className='mt-4'>
                    <Section
                        title='Charging'
                        description='Left blank, price and connectors read "Being confirmed" on the site rather than showing a number nobody has agreed.'>
                        <Field
                            label='Price per kWh (USD)'
                            hint='Before tax. Blank means no tariff is set yet.'>
                            <Input
                                inputMode='decimal'
                                value={state.pricePerKwh}
                                onChange={event => set('pricePerKwh', event.target.value)}
                                placeholder='0.39'
                            />
                        </Field>

                        <div className='sm:col-span-2'>
                            <Label className='text-sm font-medium'>Connectors</Label>
                            <p className='mt-1 mb-3 text-xs text-muted-foreground'>
                                How many of each type. A type left at zero is not shown.
                            </p>
                            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                                {CONNECTOR_TYPES.map(type => (
                                    <div
                                        key={type}
                                        className='flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2'>
                                        <span className='text-sm font-medium'>{type}</span>
                                        <Input
                                            inputMode='numeric'
                                            className='w-20 text-right'
                                            value={String(connectorCount(type))}
                                            onChange={event =>
                                                setConnectorCount(type, event.target.value)
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>
                </TabsContent>

                {/* ── Amenities ────────────────────────────────────────────── */}
                <TabsContent value='amenities' className='mt-4'>
                    <Section
                        title='Amenities'
                        description='What is on site while a driver waits. Manage the list itself under Amenities in the sidebar.'
                        columns={1}>
                        {amenities.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>
                                The catalogue is empty. Add an amenity first.
                            </p>
                        ) : (
                            <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                                {amenities.map(amenity => {
                                    const Icon = amenityIcon(amenity.icon);
                                    const checked = state.amenities.includes(amenity.slug);
                                    return (
                                        <label
                                            key={amenity.id}
                                            className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                                                checked
                                                    ? 'border-primary/40 bg-primary/5'
                                                    : 'border-border hover:bg-muted/50'
                                            }`}>
                                            <input
                                                type='checkbox'
                                                checked={checked}
                                                onChange={() => toggleAmenity(amenity.slug)}
                                                className='size-4 accent-primary'
                                            />
                                            <Icon className='size-4 text-muted-foreground' />
                                            <span className='text-sm'>{amenity.label}</span>
                                            {!amenity.active && (
                                                <span className='ml-auto text-[11px] text-muted-foreground'>
                                                    hidden
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </Section>
                </TabsContent>

                {/* ── Search and social ────────────────────────────────────── */}
                <TabsContent value='seo' className='mt-4'>
                    <Section
                        title='Search and social'
                        description='How this site appears in Google and when someone shares the link. Every field is optional: left blank, the page uses a title and description built from the address, which stays correct when the address changes.'
                        columns={1}>
                        <div className='grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start'>
                            <div className='flex flex-col gap-4'>
                                <Field
                                    label='Page title'
                                    hint={`${state.metaTitle?.length ?? 0}/60 characters. Google truncates past about 60.`}>
                                    <Input
                                        value={state.metaTitle ?? ''}
                                        onChange={event =>
                                            set('metaTitle', event.target.value || null)
                                        }
                                        placeholder={generatedTitle}
                                    />
                                </Field>

                                <Field
                                    label='Meta description'
                                    hint={`${state.metaDescription?.length ?? 0}/160 characters. Google truncates past about 160.`}>
                                    <Textarea
                                        rows={3}
                                        value={state.metaDescription ?? ''}
                                        onChange={event =>
                                            set(
                                                'metaDescription',
                                                event.target.value || null
                                            )
                                        }
                                        placeholder={generatedDescription}
                                    />
                                </Field>

                                <ImageUploadField
                                    label='Share image'
                                    hint='Shown when the link is posted to Slack, LinkedIn or X, and used as the photo in structured data. 1200x630 works everywhere.'
                                    value={state.imageUrl}
                                    publicId={state.imagePublicId}
                                    folder='locations'
                                    onChange={next =>
                                        setState(current => ({
                                            ...current,
                                            imageUrl: next.url,
                                            imagePublicId: next.publicId,
                                        }))
                                    }
                                />

                                <div className='flex items-center justify-between gap-4 rounded-[10px] border border-dash-border bg-dash-canvas/60 p-4'>
                                    <div>
                                        <Label className='text-[13px] font-medium text-dash-body'>
                                            Hide from search engines
                                        </Label>
                                        <p className='mt-1 text-[12px] leading-relaxed text-dash-faint'>
                                            Adds a noindex tag and drops the page from the
                                            sitemap. The page still works for anyone with
                                            the link.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={state.noIndex}
                                        onCheckedChange={next => set('noIndex', next)}
                                    />
                                </div>
                            </div>

                            {/* A result preview, because a character count does not tell
                                anyone what Google will actually truncate. */}
                            <div className='rounded-[10px] border border-dash-border bg-dash-canvas/60 p-4'>
                                <p className='dash-eyebrow mb-3'>Search preview</p>
                                <div className='rounded-[8px] bg-white p-3'>
                                    <p className='truncate text-[12px] text-emerald-700'>
                                        {siteOrigin}/locations/{state.slug || '…'}
                                    </p>
                                    <p className='mt-1 line-clamp-2 text-[15px] leading-snug text-[#1a0dab]'>
                                        {state.metaTitle || generatedTitle}
                                    </p>
                                    <p className='mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-dash-muted'>
                                        {state.metaDescription || generatedDescription}
                                    </p>
                                </div>

                                {state.noIndex && (
                                    <p className='mt-3 rounded-[8px] bg-amber-50 px-3 py-2 text-[12px] text-amber-700'>
                                        This page is currently hidden from search.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Section>
                </TabsContent>

                {/* ── Internal ─────────────────────────────────────────────── */}
                <TabsContent value='internal' className='mt-4'>
                    <Section
                        title='Internal'
                        description='From the signed-locations sheet. None of this reaches the public site, and some of it is the owner’s home address.'>
                        <Field label='Company' hint='Property owner’s legal entity.'>
                            <Input
                                value={state.company}
                                onChange={event => set('company', event.target.value)}
                            />
                        </Field>
                        <Field label='Sales rep'>
                            <Input
                                value={state.salesRep}
                                onChange={event => set('salesRep', event.target.value)}
                            />
                        </Field>
                        <Field label='Notice address' hint='For legal notices. Often a private home.'>
                            <Input
                                value={state.noticeAddress}
                                onChange={event => set('noticeAddress', event.target.value)}
                            />
                        </Field>
                        <Field label='APN' hint='Assessor’s parcel number.'>
                            <Input
                                value={state.apn}
                                onChange={event => set('apn', event.target.value)}
                            />
                        </Field>
                        <Field label='Signed number'>
                            <Input
                                inputMode='numeric'
                                value={state.signedNumber}
                                onChange={event => set('signedNumber', event.target.value)}
                            />
                        </Field>
                        <Field label='Pipeline reference'>
                            <Input
                                value={state.pipelineRef}
                                onChange={event => set('pipelineRef', event.target.value)}
                            />
                        </Field>
                        <Field label='Site score' hint='Internal, out of 5. Not a customer review.'>
                            <Input
                                inputMode='decimal'
                                value={state.siteScore}
                                onChange={event => set('siteScore', event.target.value)}
                            />
                        </Field>
                        <Field label='Switchgear count'>
                            <Input
                                inputMode='numeric'
                                value={state.switchgearCount}
                                onChange={event => set('switchgearCount', event.target.value)}
                            />
                        </Field>
                        <Field label='Switchgear ordered'>
                            <Input
                                value={state.switchgearOrderedDate}
                                onChange={event =>
                                    set('switchgearOrderedDate', event.target.value)
                                }
                                placeholder='8/1/26'
                            />
                        </Field>
                        <Field label='Address as written' hint='The unparsed line from the sheet.'>
                            <Input
                                value={state.addressRaw}
                                onChange={event => set('addressRaw', event.target.value)}
                            />
                        </Field>
                        <div className='sm:col-span-2'>
                            <Label className='text-sm font-medium'>Notes</Label>
                            <Textarea
                                className='mt-2'
                                rows={4}
                                value={state.initialNotes}
                                onChange={event => set('initialNotes', event.target.value)}
                            />
                        </div>
                    </Section>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Section({
    title,
    description,
    columns = 2,
    children,
}: {
    title: string;
    description: string;
    columns?: 1 | 2;
    children: React.ReactNode;
}) {
    return (
        <div className='dash-card p-5 md:p-6'>
            <h2 className='text-[15px] font-semibold tracking-[-0.01em] text-dash-heading'>
                {title}
            </h2>
            <p className='mt-1 mb-6 max-w-2xl text-[13px] leading-relaxed text-dash-muted'>
                {description}
            </p>
            <div
                className={`grid gap-4 ${columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                {children}
            </div>
        </div>
    );
}

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className='flex flex-col gap-2'>
            <Label className='text-[13px] font-medium text-dash-body'>{label}</Label>
            {children}
            {hint && (
                <p className='text-[12px] leading-relaxed text-dash-faint'>{hint}</p>
            )}
        </div>
    );
}
