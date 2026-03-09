// src/components/_shared/DataTable.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '@/components/form/Select';

/**
 * Metadata untuk Server-Side Pagination
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

/**
 * Props untuk komponen DataTable
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  meta?: PaginationMeta;
  onPageChange?: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
}

/**
 * Komponen DataTable Reusable
 * Menggabungkan TanStack Table dengan custom styling dan Server-Side Pagination.
 * * @param {DataTableProps} props - Properti komponen
 * @returns {JSX.Element} Elemen DataTable
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Tidak ada data yang ditemukan.',
  meta,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel dihapus karena kita pakai Server-Side Pagination
  });

  return (
    <div className='w-full bg-card border border-border shadow-soft-depth overflow-hidden flex flex-col'>
      <div className='overflow-x-auto custom-scrollbar'>
        <table className='w-full text-sm text-left border-collapse'>
          <thead className='bg-muted/50 border-b border-border'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className='px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-muted-foreground whitespace-nowrap'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className='divide-y divide-border/60'>
            {isLoading ? (
              // Loading State
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className='px-5 py-4'>
                      <Skeleton className='h-5 w-full bg-muted/60 rounded-md' />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows?.length ? (
              // Data Table
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className='hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors group'
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-5 py-3 align-middle'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Empty State
              <tr>
                <td
                  colSpan={columns.length}
                  className='h-48 text-center bg-background/30'
                >
                  <div className='flex flex-col items-center justify-center text-muted-foreground'>
                    <PackageOpen className='h-10 w-10 opacity-30 mb-3' />
                    <p className='text-sm font-medium'>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SERVER-SIDE PAGINATION UI */}
      {!isLoading && meta && meta.total > 0 && (
        <div className='flex items-center justify-between px-6 py-4 border-t border-border bg-background'>
          <div className='text-sm text-muted-foreground'>
            Menampilkan{' '}
            <span className='font-semibold text-foreground'>
              {(meta.page - 1) * meta.pageSize + 1}
            </span>{' '}
            -{' '}
            <span className='font-semibold text-foreground'>
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            dari{' '}
            <span className='font-semibold text-foreground'>{meta.total}</span>{' '}
            data
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-3'>
              <span className='text-xs text-muted-foreground'>
                Baris per halaman:
              </span>
              <div className='w-20'>
                <Select
                  options={[
                    { label: '5', value: '5' },
                    { label: '10', value: '10' },
                    { label: '20', value: '20' },
                    { label: '50', value: '50' },
                  ]}
                  value={meta.pageSize.toString()}
                  onChange={(val) => onPageSizeChange?.(Number(val))}
                />
              </div>
            </div>

            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => onPageChange?.(Math.max(1, meta.page - 1))}
                disabled={meta.page === 1}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <div className='flex items-center justify-center w-12 text-sm font-medium'>
                {meta.page} / {meta.pageCount || 1}
              </div>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => onPageChange?.(meta.page + 1)}
                disabled={meta.page >= (meta.pageCount || 1)}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
