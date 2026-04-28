'use client';

import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconSearch,
} from '@tabler/icons-react';
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';

import * as React from 'react';

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    searchColumn?: string;
    onReorder?: (newData: TData[]) => void;
    actionButton?: React.ReactNode;
    batchActions?: (
        selectedRows: TData[],
        clearSelection: () => void
    ) => React.ReactNode;
}

function DraggableRow<TData>({ row }: { row: Row<TData> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.id,
    });

    return (
        <TableRow
            data-state={row.getIsSelected() && 'selected'}
            data-dragging={isDragging}
            ref={setNodeRef}
            className='relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 border-border/40 hover:bg-muted/30 transition-colors'
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}>
            {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id} className='py-3'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
}

export function DataTable<TData extends { id: string | number }, TValue>({
    columns,
    data: initialData,
    searchPlaceholder = 'Filter...',
    searchColumn,
    onReorder,
    actionButton,
    batchActions,
}: DataTableProps<TData, TValue>) {
    const [data, setData] = React.useState(() => initialData);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    React.useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const sortableId = React.useId();
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => data?.map(({ id }) => id.toString()) || [],
        [data]
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        getRowId: (row, index) =>
            row.id ? row.id.toString() : index.toString(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = dataIds.indexOf(active.id);
            const newIndex = dataIds.indexOf(over.id);
            const newData = arrayMove(data, oldIndex, newIndex);
            setData(newData);
            onReorder?.(newData);
        }
    }

    const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map(r => r.original);
    const hasSelection = selectedRows.length > 0;
    const clearSelection = () => table.resetRowSelection();

    return (
        <div className='w-full space-y-4 '>
            {/* Toolbar */}
            <div className='flex items-center gap-2 justify-between'>
                <div className='flex flex-1 items-center space-x-2'>
                    {searchColumn && (
                        <div className='relative w-full max-w-sm'>
                            <IconSearch className='absolute left-2.5 top-3.5 h-6 w-5 text-muted-foreground mr-2' />
                            <Input
                                placeholder={searchPlaceholder}
                                value={
                                    (table
                                        .getColumn(searchColumn)
                                        ?.getFilterValue() as string) ?? ''
                                }
                                onChange={event =>
                                    table
                                        .getColumn(searchColumn)
                                        ?.setFilterValue(event.target.value)
                                }
                                className='pl-9 bg-background/50 border-border/50 h-8 py-6'
                            />
                        </div>
                    )}
                </div>
                <div className='flex items-center gap-2'>{actionButton}</div>
            </div>

            {/* Batch Action Bar */}
            {hasSelection && batchActions && (
                <div className='flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 animate-in fade-in slide-in-from-top-1 duration-200'>
                    <span className='text-sm font-medium text-primary '>
                        {selectedRows.length} selected
                    </span>
                    <div className='h-4 w-px bg-border' />
                    <div className='flex items-center gap-2 flex-wrap'>
                        {batchActions(selectedRows, clearSelection)}
                    </div>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='ml-auto h-7 text-xs text-muted-foreground hover:text-foreground'
                        onClick={clearSelection}>
                        Clear
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className='overflow-hidden rounded-xl border border-border/50 bg-background/30 backdrop-blur-sm shadow-sm'>
                <DndContext
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragEnd={handleDragEnd}
                    sensors={sensors}
                    id={sortableId}>
                    <Table>
                        <TableHeader className='bg-muted/50 border-b border-border/50'>
                            {table.getHeaderGroups().map(headerGroup => (
                                <TableRow
                                    key={headerGroup.id}
                                    className='hover:bg-transparent border-border/50'>
                                    {headerGroup.headers.map(header => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                className='text-muted-foreground  font-semibold py-4 text-xs uppercase tracking-wider'>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className='**:data-[slot=table-cell]:first:w-8'>
                            {table.getRowModel().rows?.length ? (
                                <SortableContext
                                    items={dataIds}
                                    strategy={verticalListSortingStrategy}>
                                    {table.getRowModel().rows.map(row => (
                                        <DraggableRow key={row.id} row={row} />
                                    ))}
                                </SortableContext>
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className='h-24 text-center text-muted-foreground'>
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            {/* Pagination */}
            <div className='flex flex-col items-center justify-between gap-4 px-2 py-4 sm:flex-row'>
                <div className='text-muted-foreground order-2 text-sm  sm:order-1'>
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className='flex flex-col items-center gap-4 sm:order-2 sm:flex-row sm:gap-6 lg:gap-8'>
                    <div className='flex items-center gap-2'>
                        <Label
                            htmlFor='rows-per-page'
                            className='text-muted-foreground whitespace-nowrap text-xs font-medium'>
                            Rows per page
                        </Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={value => {
                                table.setPageSize(Number(value));
                            }}>
                            <SelectTrigger
                                size='sm'
                                className='h-8 w-[70px] border-border/50 bg-background/50'
                                id='rows-per-page'>
                                <SelectValue
                                    placeholder={
                                        table.getState().pagination.pageSize
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent side='top'>
                                {[10, 20, 30, 40, 50].map(pageSize => (
                                    <SelectItem
                                        key={pageSize}
                                        value={`${pageSize}`}
                                        className='text-xs'>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className='flex items-center gap-6 sm:gap-6 lg:gap-8'>
                        <div className='text-muted-foreground flex items-center justify-center text-xs font-medium'>
                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount() || 1}
                        </div>
                        <div className='flex items-center gap-1'>
                            <Button
                                variant='outline'
                                className='hidden h-8 w-8 p-0 bg-background/50 border-border/50 lg:flex'
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}>
                                <span className='sr-only'>
                                    Go to first page
                                </span>
                                <IconChevronsLeft className='size-4' />
                            </Button>
                            <Button
                                variant='outline'
                                className='size-8 border-border/50 bg-background/50'
                                size='icon'
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}>
                                <span className='sr-only'>
                                    Go to previous page
                                </span>
                                <IconChevronLeft className='size-4' />
                            </Button>
                            <Button
                                variant='outline'
                                className='size-8 border-border/50 bg-background/50'
                                size='icon'
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}>
                                <span className='sr-only'>Go to next page</span>
                                <IconChevronRight className='size-4' />
                            </Button>
                            <Button
                                variant='outline'
                                className='hidden size-8 border-border/50 bg-background/50 lg:flex'
                                size='icon'
                                onClick={() =>
                                    table.setPageIndex(table.getPageCount() - 1)
                                }
                                disabled={!table.getCanNextPage()}>
                                <span className='sr-only'>Go to last page</span>
                                <IconChevronsRight className='size-4' />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


