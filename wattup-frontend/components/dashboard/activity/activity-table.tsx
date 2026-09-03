'use client';

import { useMemo } from 'react';

import { DataTable } from '@/components/data-table';
import type { ActivityPage, ActivityRow, ActivityScope } from '@/lib/dashboard/activity';

import { makeActivityColumns } from './activity-columns';

/**
 * The activity list, on the dashboard's shared DataTable.
 *
 * A module table in the reference's sense: it brings its columns and its empty wording
 * and leaves paging, the loading state and the stale-rows behaviour to the one table
 * component every list here uses. Both screens that show activity render this, so the
 * whole log and one person's history cannot drift apart in how they behave.
 *
 * The shared table pages by zero-based index, which is what TanStack's table state uses;
 * the rest of this app counts pages from one. The conversion happens here rather than
 * leaking either convention into the other.
 */
export function ActivityDataTable({
    result,
    scope,
    isLoading,
    isStale,
    isFiltered = false,
    showWho = false,
    subjectId,
    onPageChange,
    onLimitChange,
}: {
    result: ActivityPage;
    scope: ActivityScope;
    isLoading?: boolean;
    isStale?: boolean;
    isFiltered?: boolean;
    showWho?: boolean;
    subjectId?: string;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}) {
    const columns = useMemo(
        () => makeActivityColumns({ showWho, signIn: scope === 'signin', subjectId }),
        [showWho, scope, subjectId]
    );

    return (
        <DataTable<ActivityRow, unknown>
            columns={columns}
            data={result.rows}
            isLoading={isLoading}
            isStale={isStale}
            isFiltered={isFiltered}
            manualPagination
            pageCount={Math.max(1, Math.ceil(result.total / result.pageSize))}
            paginationState={{ pageIndex: result.page - 1, pageSize: result.pageSize }}
            onPaginationChange={next => {
                if (next.pageSize !== result.pageSize) onLimitChange(next.pageSize);
                else onPageChange(next.pageIndex + 1);
            }}
            emptyTitle={scope === 'signin' ? 'No sign-ins recorded yet' : 'Nothing recorded yet'}
            emptyDescription={
                scope === 'signin'
                    ? 'Sign-ins and code requests from both applications appear here as they happen.'
                    : 'Events from the dashboard and the pro-forma builder appear here as they happen.'
            }
        />
    );
}
