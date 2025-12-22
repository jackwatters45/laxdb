import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type RowSelectionState,
  type TableMeta,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ClassNameChildrenProp, ClassNameProp } from '@/types';
import {
  DataTableContext,
  type DataTableContextValue,
  useDataTable,
} from './use-data-table';

type DataTableProviderProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  showAllRows?: boolean;
  meta?: TableMeta<TData>;
  children: React.ReactNode;
};

function DataTableProvider<TData>({
  columns,
  data,
  showAllRows = true,
  meta,
  children,
}: DataTableProviderProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    ...(meta !== undefined && { meta }),
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(!showAllRows && { pagination }),
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(!showAllRows && {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
    }),
  });

  const value = {
    columns,
    table,
  };

  return (
    <DataTableContext.Provider value={value as DataTableContextValue<unknown>}>
      {children}
    </DataTableContext.Provider>
  );
}

type DataTableRootProps = ClassNameChildrenProp & {};

function DataTableRoot({ children, className }: DataTableRootProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}

type DataTableContentProps = ClassNameChildrenProp & {};

function DataTableContent({ children, className }: DataTableContentProps) {
  return (
    <div className={cn('relative overflow-hidden overflow-x-auto', className)}>
      <Table className={className}>{children}</Table>
    </div>
  );
}

type DataTableHeaderProps = ClassNameProp & {};

function DataTableHeader({ className }: DataTableHeaderProps) {
  const { table } = useDataTable();

  return (
    <TableHeader className={className}>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow className="border-border border-y" key={headerGroup.id}>
          {headerGroup.headers.map((header, i) => (
            <TableHead
              className={cn(
                'text-foreground',
                header.column.columnDef.meta?.className,
                i === headerGroup.headers.length - 1 ? '-translate-x-2' : ''
              )}
              key={header.id}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}

type DataTableBodyProps = ClassNameProp & {};

function DataTableBody({ className }: DataTableBodyProps) {
  const { table, columns } = useDataTable();

  return (
    <TableBody className={className}>
      {table.getRowModel().rows?.length ? (
        table
          .getRowModel()
          .rows.map((row) => <DataTableRow key={row.id} row={row} />)
      ) : (
        <TableRow>
          <TableCell className="h-24 text-center" colSpan={columns.length}>
            No results.
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

type DataTableRowProps = ClassNameProp & {
  row: Row<unknown>;
};

function DataTableRow({ row, className }: DataTableRowProps) {
  return (
    <TableRow className={cn('group hover:bg-muted/50', className)}>
      {row.getVisibleCells().map((cell, index) => (
        <TableCell
          className={cn(
            row.getIsSelected() ? 'bg-muted/50' : '',
            'relative whitespace-nowrap py-1 text-foreground first:w-8',
            index === 0 ? '' : 'border-l',
            index === 0 ? 'pl-2' : '',
            index === row.getVisibleCells().length - 1 ? 'pr-2' : '',
            cell.column.columnDef.meta?.className
          )}
          key={cell.id}
        >
          {index === 0 && row.getIsSelected() && (
            <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
          )}
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export {
  DataTableBody,
  DataTableContent,
  DataTableHeader,
  DataTableProvider,
  DataTableRoot,
  type useDataTable,
};
