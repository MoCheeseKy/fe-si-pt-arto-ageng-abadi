// src/components/_shared/DataTable.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageOpen } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Tidak ada data yang ditemukan.',
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className='w-full bg-card border border-border  shadow-soft-depth overflow-hidden'>
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
    </div>
  );
}
