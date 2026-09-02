'use client';

import {
    createAmenity,
    deleteAmenity,
    reorderAmenities,
    setAmenityActive,
    updateAmenity,
} from '@/app/_actions/amenityActions';
import type { DashboardAmenity } from '@/lib/locations/dashboard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/dashboard/ui/empty-state';
import { AMENITY_ICON_KEYS, amenityIcon } from '@/lib/locations/amenities';
import { slugify } from '@/lib/validations/location';
import { IconPlus } from '@tabler/icons-react';
import { ArrowDown, ArrowUp, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface Props {
    amenities: DashboardAmenity[];
    canManage: boolean;
}

interface Draft {
    id: string | null;
    slug: string;
    label: string;
    icon: string;
    sortOrder: number;
    active: boolean;
}

const NEW_DRAFT: Draft = {
    id: null,
    slug: '',
    label: '',
    icon: 'dot',
    sortOrder: 0,
    active: true,
};

export function AmenitiesClient({ amenities, canManage }: Props) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [draft, setDraft] = useState<Draft | null>(null);
    const [pendingDelete, setPendingDelete] = useState<DashboardAmenity | null>(null);
    const [saving, setSaving] = useState(false);

    const onToggleActive = (amenity: DashboardAmenity, active: boolean) => {
        startTransition(async () => {
            const result = await setAmenityActive(amenity.id, active);
            if (!result.success) toast.error(result.error);
            router.refresh();
        });
    };

    /**
     * Reordering swaps a row with its neighbour and persists the whole order.
     *
     * Sending the full list rather than the two changed rows means the server writes one
     * consistent sequence, so a list that has drifted, by a concurrent edit or a failed
     * earlier write, is repaired rather than compounded.
     */
    const move = (index: number, direction: -1 | 1) => {
        const next = [...amenities];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];

        startTransition(async () => {
            const result = await reorderAmenities(next.map(amenity => amenity.id));
            if (!result.success) toast.error(result.error);
            router.refresh();
        });
    };

    const onSaveDraft = async () => {
        if (!draft) return;
        setSaving(true);
        const payload = {
            slug: draft.slug,
            label: draft.label,
            icon: draft.icon,
            sortOrder: draft.sortOrder,
            active: draft.active,
        };
        const result = draft.id
            ? await updateAmenity(draft.id, payload)
            : await createAmenity(payload);
        setSaving(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }
        toast.success(draft.id ? 'Amenity saved' : 'Amenity added');
        setDraft(null);
        router.refresh();
    };

    const onDelete = async () => {
        if (!pendingDelete) return;
        const result = await deleteAmenity(pendingDelete.id);
        if (result.success) {
            toast.success(`${pendingDelete.label} deleted`);
            setPendingDelete(null);
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className='flex flex-col gap-4'>
            {canManage && (
                <div className='flex justify-end'>
                    <button
                        type='button'
                        onClick={() =>
                            setDraft({
                                ...NEW_DRAFT,
                                sortOrder: (amenities.at(-1)?.sortOrder ?? 0) + 10,
                            })
                        }
                        className='flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover'>
                        <IconPlus className='size-4' />
                        Add amenity
                    </button>
                </div>
            )}

            <div className='dash-card overflow-hidden'>
                <Table>
                    <TableHeader className='border-b border-dash-border bg-dash-canvas/70'>
                        <TableRow className='hover:bg-transparent'>
                            <TableHead className='dash-eyebrow h-11 w-24 py-0'>Order</TableHead>
                            <TableHead className='dash-eyebrow h-11 py-0'>Amenity</TableHead>
                            <TableHead className='dash-eyebrow h-11 py-0'>Slug</TableHead>
                            <TableHead className='dash-eyebrow h-11 py-0 text-right'>
                                Sites
                            </TableHead>
                            <TableHead className='dash-eyebrow h-11 py-0 text-center'>
                                Shown
                            </TableHead>
                            <TableHead className='h-11 w-px py-0' />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {amenities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className='p-0'>
                                    <EmptyState
                                        icon={Sparkles}
                                        title='No amenities yet'
                                        description='Add the facilities a site can offer, or run the seed to load the starting catalogue.'
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            amenities.map((amenity, index) => {
                                const Icon = amenityIcon(amenity.icon);
                                return (
                                    <TableRow
                                        key={amenity.id}
                                        className='border-dash-border hover:bg-dash-canvas/60'>
                                        <TableCell>
                                            <div className='flex items-center gap-0.5'>
                                                <button
                                                    type='button'
                                                    disabled={!canManage || index === 0}
                                                    onClick={() => move(index, -1)}
                                                    aria-label={`Move ${amenity.label} up`}
                                                    className='rounded p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30'>
                                                    <ArrowUp className='size-3.5' />
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={
                                                        !canManage || index === amenities.length - 1
                                                    }
                                                    onClick={() => move(index, 1)}
                                                    aria-label={`Move ${amenity.label} down`}
                                                    className='rounded p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30'>
                                                    <ArrowDown className='size-3.5' />
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className='flex items-center gap-2 font-medium'>
                                                <Icon className='size-4 text-muted-foreground' />
                                                {amenity.label}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <code className='rounded bg-dash-canvas px-1.5 py-0.5 font-mono text-[12px] text-dash-muted'>
                                                {amenity.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell className='dash-num text-right text-dash-body'>
                                            {amenity.locationCount === 0 ? (
                                                <span className='text-dash-faint'>None</span>
                                            ) : (
                                                amenity.locationCount
                                            )}
                                        </TableCell>
                                        <TableCell className='text-center'>
                                            <Switch
                                                checked={amenity.active}
                                                disabled={!canManage}
                                                onCheckedChange={next =>
                                                    onToggleActive(amenity, next)
                                                }
                                                aria-label={`Show ${amenity.label} on the public site`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className='flex items-center justify-end gap-1'>
                                                {canManage && (
                                                    <>
                                                        <button
                                                            type='button'
                                                            title='Edit'
                                                            onClick={() =>
                                                                setDraft({
                                                                    id: amenity.id,
                                                                    slug: amenity.slug,
                                                                    label: amenity.label,
                                                                    icon: amenity.icon,
                                                                    sortOrder: amenity.sortOrder,
                                                                    active: amenity.active,
                                                                })
                                                            }
                                                            className='rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'>
                                                            <Pencil className='size-4' />
                                                        </button>
                                                        <button
                                                            type='button'
                                                            title='Delete'
                                                            onClick={() => setPendingDelete(amenity)}
                                                            className='rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'>
                                                            <Trash2 className='size-4' />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ── Add / edit ───────────────────────────────────────────────── */}
            <Dialog open={draft !== null} onOpenChange={open => !open && setDraft(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{draft?.id ? 'Edit amenity' : 'Add amenity'}</DialogTitle>
                        <DialogDescription>
                            The label is what a visitor reads. The icon is drawn beside it on
                            the filter, the card and the station page.
                        </DialogDescription>
                    </DialogHeader>

                    {draft && (
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col gap-2'>
                                <Label>Label</Label>
                                <Input
                                    value={draft.label}
                                    onChange={event =>
                                        setDraft({
                                            ...draft,
                                            label: event.target.value,
                                            // Only while creating: changing a live slug breaks
                                            // links that already carry it in ?amenities=.
                                            slug: draft.id
                                                ? draft.slug
                                                : slugify(event.target.value),
                                        })
                                    }
                                    placeholder='Restrooms'
                                />
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label>Slug</Label>
                                <Input
                                    value={draft.slug}
                                    onChange={event =>
                                        setDraft({ ...draft, slug: event.target.value })
                                    }
                                    placeholder='restrooms'
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {draft.id
                                        ? 'Used in shared filter links. Changing it stops old links matching this amenity.'
                                        : 'Used in shared filter links. Lowercase letters, numbers, hyphens and underscores.'}
                                </p>
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label>Icon</Label>
                                <Select
                                    value={draft.icon}
                                    onValueChange={value => setDraft({ ...draft, icon: value })}>
                                    <SelectTrigger className='w-full'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className='max-h-72'>
                                        {AMENITY_ICON_KEYS.map(key => {
                                            const Icon = amenityIcon(key);
                                            return (
                                                <SelectItem key={key} value={key}>
                                                    <span className='flex items-center gap-2'>
                                                        <Icon className='size-4' />
                                                        {key}
                                                    </span>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='flex items-center justify-between rounded-md border border-border p-3'>
                                <div>
                                    <Label className='text-sm'>Shown on the public site</Label>
                                    <p className='mt-1 text-xs text-muted-foreground'>
                                        Off keeps every assignment and hides the amenity.
                                    </p>
                                </div>
                                <Switch
                                    checked={draft.active}
                                    onCheckedChange={next => setDraft({ ...draft, active: next })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant='outline' onClick={() => setDraft(null)}>
                            Cancel
                        </Button>
                        <Button onClick={onSaveDraft} disabled={saving}>
                            {draft?.id ? 'Save' : 'Add'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete ───────────────────────────────────────────────────── */}
            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={open => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {pendingDelete?.label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingDelete?.locationCount
                                ? `${pendingDelete.locationCount} site${pendingDelete.locationCount === 1 ? '' : 's'} currently have this, and will lose it permanently. `
                                : 'No site currently has this. '}
                            To hide it and keep every assignment, switch
                            &ldquo;Shown&rdquo; off instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDelete}
                            className='bg-destructive text-white hover:bg-destructive/90'>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
