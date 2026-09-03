'use client';

import { deleteLocation, setLocationPublished } from '@/app/_actions/locationActions';
import type { DashboardLocation } from '@/lib/locations/dashboard';
import { DataTable } from '@/components/data-table';
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
import { BatchButton } from '@/components/dashboard/ui/batch-bar';
import { SegmentedFilter } from '@/components/dashboard/ui/toolbar';
import { Button } from '@/components/ui/button';
import type { StationStatus } from '@/lib/locations/types';
import { IconPlus } from '@tabler/icons-react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createLocationColumns } from './columns';
import { STATUS_OPTIONS } from './status';

interface Props {
    locations: DashboardLocation[];
    /** MANAGE_LOCATIONS: may add sites and change what the public map shows. */
    canManage: boolean;
    canDelete: boolean;
}

type StatusFilter = StationStatus | 'ALL';
type VisibilityFilter = 'ALL' | 'PUBLISHED' | 'HIDDEN';

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PUBLISHED', label: 'On the site' },
    { value: 'HIDDEN', label: 'Hidden' },
];

/** Twenty a page, so the whole 2026 build fits on the first one. */
const PAGE_SIZE = 20;

export function LocationsClient({ locations, canManage, canDelete }: Props) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [status, setStatus] = useState<StatusFilter>('ALL');
    const [visibility, setVisibility] = useState<VisibilityFilter>('ALL');
    const [pendingDelete, setPendingDelete] = useState<DashboardLocation | null>(null);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: PAGE_SIZE,
    });

    /**
     * The publish switch flips immediately and the server catches up.
     *
     * A toggle that waits for a round trip before it moves reads as broken however fast
     * the request is. If the write fails, this snaps back to what the server actually
     * says rather than leaving the switch lying.
     */
    const [rows, applyOptimistic] = useOptimistic(
        locations,
        (state: DashboardLocation[], patch: { ids: string[]; published: boolean }) =>
            state.map(row =>
                patch.ids.includes(row.id) ? { ...row, published: patch.published } : row
            )
    );

    // Status and visibility are filtered here rather than as column filters, so the
    // table's own search box narrows what these have already chosen, and the row count
    // and pagination both describe the same set.
    const filtered = useMemo(
        () =>
            rows.filter(row => {
                if (status !== 'ALL' && row.status !== status) return false;
                if (visibility === 'PUBLISHED' && !row.published) return false;
                if (visibility === 'HIDDEN' && row.published) return false;
                return true;
            }),
        [rows, status, visibility]
    );

    const setPublished = (targets: DashboardLocation[], published: boolean) => {
        const ids = targets.map(row => row.id);
        startTransition(async () => {
            applyOptimistic({ ids, published });

            const results = await Promise.all(
                targets.map(row => setLocationPublished(row.id, published))
            );
            const failed = results.filter(result => !result.success).length;

            if (failed > 0) {
                toast.error(
                    `${failed} of ${targets.length} could not be changed. Nothing else was affected.`
                );
            } else if (targets.length === 1) {
                toast.success(
                    published
                        ? `${targets[0].name} is on the site`
                        : `${targets[0].name} is hidden`
                );
            } else {
                toast.success(
                    `${targets.length} locations ${published ? 'shown' : 'hidden'}`
                );
            }
            router.refresh();
        });
    };

    const onDelete = async () => {
        if (!pendingDelete) return;
        const result = await deleteLocation(pendingDelete.id);
        if (result.success) {
            toast.success(`${pendingDelete.name} deleted`);
            setPendingDelete(null);
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const columns = useMemo(
        () =>
            createLocationColumns({
                canDelete,
                onPublishChange: (row, published) => setPublished([row], published),
                onDelete: setPendingDelete,
            }),
        // setPublished closes over the current rows through useOptimistic, and is stable
        // enough for the table: rebuilding the columns on every publish would reset the
        // page the person is looking at.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [canDelete]
    );

    return (
        <div className='flex flex-col gap-4'>
            <DataTable
                data={filtered}
                columns={columns}
                searchColumn='site'
                searchPlaceholder='Search name, city or slug...'
                paginationState={pagination}
                onPaginationChange={setPagination}
                actionButton={
                    <div className='flex flex-wrap items-center gap-2'>
                        <SegmentedFilter
                            label='Filter by status'
                            options={[{ value: 'ALL', label: 'All' }, ...STATUS_OPTIONS]}
                            value={status}
                            onChange={value => {
                                setStatus(value as StatusFilter);
                                // Back to the first page: staying on page 2 of a set that
                                // just shrank to one page shows an empty table.
                                setPagination(p => ({ ...p, pageIndex: 0 }));
                            }}
                        />
                        <SegmentedFilter
                            label='Filter by visibility'
                            options={VISIBILITY_OPTIONS}
                            value={visibility}
                            onChange={value => {
                                setVisibility(value as VisibilityFilter);
                                setPagination(p => ({ ...p, pageIndex: 0 }));
                            }}
                        />
                        {canManage && (
                            <Link
                                href='/dashboard/locations/create'
                                prefetch
                                className='flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover'>
                                <IconPlus className='size-4' />
                                Add location
                            </Link>
                        )}
                    </div>
                }
                batchActions={
                    canManage
                        ? (selected, clearSelection) => (
                              <>
                                  <BatchButton
                                      icon={Eye}
                                      onClick={() => {
                                          setPublished(selected, true);
                                          clearSelection();
                                      }}>
                                      Show on the site
                                  </BatchButton>
                                  <BatchButton
                                      icon={EyeOff}
                                      onClick={() => {
                                          setPublished(selected, false);
                                          clearSelection();
                                      }}>
                                      Hide
                                  </BatchButton>
                              </>
                          )
                        : undefined
                }
            />

            <p className='text-[12.5px] text-dash-muted'>
                Turning a site off hides it from the map, the list and its own page, and
                keeps the record.
            </p>

            <AlertDialog
                open={pendingDelete !== null}
                onOpenChange={open => !open && setPendingDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the site, its amenity assignments and its connectors
                            for good, and its page at /locations/{pendingDelete?.slug} will
                            404. To take it off the site and keep the record, switch
                            &ldquo;On the site&rdquo; off instead.
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
