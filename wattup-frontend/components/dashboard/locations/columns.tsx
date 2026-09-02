'use client';

import type { DashboardLocation } from '@/lib/locations/dashboard';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import type { StationStatus } from '@/lib/locations/types';
import type { ColumnDef } from '@tanstack/react-table';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { STATUS_CLASSES, statusLabelFor } from './status';

interface Options {
    canDelete: boolean;
    onPublishChange: (row: DashboardLocation, published: boolean) => void;
    onDelete: (row: DashboardLocation) => void;
}

export function createLocationColumns({
    canDelete,
    onPublishChange,
    onDelete,
}: Options): ColumnDef<DashboardLocation>[] {
    return [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={value =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label='Select all on this page'
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={value => row.toggleSelected(!!value)}
                    aria-label={`Select ${row.original.name}`}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'site',
            header: 'Site',
            // The accessor carries city, region and slug as well as the name, so the
            // table's single search box matches any of them. The cell below decides what
            // is actually shown, so widening what is searchable costs no layout.
            accessorFn: row =>
                `${row.name} ${row.city} ${row.region} ${row.slug}`,
            cell: ({ row }) => (
                <div className='min-w-[180px]'>
                    <div className='font-medium'>{row.original.name}</div>
                    <div className='text-xs text-muted-foreground'>
                        {row.original.city}, {row.original.region} &middot;{' '}
                        {row.original.goLiveYear}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant='outline'
                    className={STATUS_CLASSES[row.original.status as StationStatus]}>
                    {statusLabelFor(row.original.status as StationStatus)}
                </Badge>
            ),
        },
        {
            accessorKey: 'chargerCount',
            header: () => <div className='text-right'>Bays</div>,
            cell: ({ row }) => (
                <div className='text-right tabular-nums'>
                    {row.original.chargerCount}
                </div>
            ),
        },
        {
            accessorKey: 'maxPowerKw',
            header: () => <div className='text-right'>Power</div>,
            cell: ({ row }) => (
                <div className='text-right tabular-nums'>
                    {row.original.maxPowerKw}kW
                </div>
            ),
        },
        {
            accessorKey: 'pricePerKwh',
            header: () => <div className='text-right'>Price</div>,
            cell: ({ row }) => (
                <div className='text-right tabular-nums'>
                    {row.original.pricePerKwh === null ? (
                        <span className='text-muted-foreground'>Not set</span>
                    ) : (
                        `$${row.original.pricePerKwh.toFixed(2)}`
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'amenityCount',
            header: () => <div className='text-right'>Amenities</div>,
            cell: ({ row }) => (
                <div className='text-right tabular-nums'>
                    {row.original.amenityCount === 0 ? (
                        <span className='text-muted-foreground'>None</span>
                    ) : (
                        row.original.amenityCount
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'published',
            header: () => <div className='text-center'>On the site</div>,
            cell: ({ row }) => (
                <div className='flex justify-center'>
                    <Switch
                        checked={row.original.published}
                        onCheckedChange={next => onPublishChange(row.original, next)}
                        aria-label={`Show ${row.original.name} on the public site`}
                    />
                </div>
            ),
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            // One menu rather than three icons in every row. A column of repeated icons
            // is visual noise on a list this long, and the destructive one sits a
            // mis-click away from Edit; behind a menu it needs an explicit open first.
            cell: ({ row }) => (
                <div className='flex justify-end'>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            aria-label={`Actions for ${row.original.name}`}
                            className='flex size-8 items-center justify-center rounded-[8px] text-dash-faint transition-colors hover:bg-dash-canvas hover:text-dash-heading data-[state=open]:bg-dash-canvas data-[state=open]:text-dash-heading'>
                            <MoreHorizontal className='size-4' />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuItem asChild>
                                <Link href={`/dashboard/locations/edit/${row.original.id}`}>
                                    <Pencil className='size-4' />
                                    Edit location
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`/locations/${row.original.slug}`}
                                    target='_blank'
                                    rel='noopener noreferrer'>
                                    <ExternalLink className='size-4' />
                                    View on the site
                                </Link>
                            </DropdownMenuItem>
                            {canDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant='destructive'
                                        onSelect={() => onDelete(row.original)}>
                                        <Trash2 className='size-4' />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];
}
