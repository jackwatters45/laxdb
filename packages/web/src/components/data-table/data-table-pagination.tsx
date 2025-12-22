import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from '@remixicon/react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
};

function PaginationSelectedCount<TData>({ table }: { table: Table<TData> }) {
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="text-muted-foreground text-sm tabular-nums">
      {selectedRows} of {totalRows} row(s) selected.
    </div>
  );
}

function PaginationPageSizeSelect<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="flex items-center space-x-2">
      <p className="font-medium text-muted-foreground text-sm">Rows per page</p>
      <Select
        onValueChange={(value) => {
          table.setPageSize(Number(value));
        }}
        value={`${table.getState().pagination.pageSize}`}
      >
        <SelectTrigger className="h-7 w-[70px]">
          <SelectValue placeholder={table.getState().pagination.pageSize} />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 25, 50, 75, 100].map((pageSize) => (
            <SelectItem key={pageSize} value={`${pageSize}`}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PaginationInfo<TData>({ table }: { table: Table<TData> }) {
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  const currentPage = table.getState().pagination.pageIndex;
  const firstRowIndex = currentPage * pageSize + 1;
  const lastRowIndex = Math.min(totalRows, firstRowIndex + pageSize - 1);

  return (
    <p className="hidden text-muted-foreground text-sm tabular-nums sm:block">
      Showing{' '}
      <span className="font-medium text-foreground">
        {firstRowIndex}-{lastRowIndex}
      </span>{' '}
      of <span className="font-medium text-foreground">{totalRows}</span>
    </p>
  );
}

function PaginationControls<TData>({ table }: { table: Table<TData> }) {
  const paginationButtons = [
    {
      icon: RiArrowLeftDoubleLine,
      onClick: () => table.setPageIndex(0),
      disabled: !table.getCanPreviousPage(),
      srText: 'First page',
      mobileView: 'hidden sm:block',
    },
    {
      icon: RiArrowLeftSLine,
      onClick: () => table.previousPage(),
      disabled: !table.getCanPreviousPage(),
      srText: 'Previous page',
      mobileView: '',
    },
    {
      icon: RiArrowRightSLine,
      onClick: () => table.nextPage(),
      disabled: !table.getCanNextPage(),
      srText: 'Next page',
      mobileView: '',
    },
    {
      icon: RiArrowRightDoubleLine,
      onClick: () => table.setPageIndex(table.getPageCount() - 1),
      disabled: !table.getCanNextPage(),
      srText: 'Last page',
      mobileView: 'hidden sm:block',
    },
  ];

  return (
    <div className="flex items-center gap-x-1.5">
      {paginationButtons.map((button) => (
        <Button
          className={cn(button.mobileView, 'h-7 px-1.5')}
          disabled={button.disabled}
          key={button.srText}
          onClick={() => {
            button.onClick();
            table.resetRowSelection();
          }}
          size="sm"
          variant="outline"
        >
          <span className="sr-only">{button.srText}</span>
          <button.icon aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      ))}
    </div>
  );
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <PaginationSelectedCount table={table} />

      <div className="flex items-center gap-x-6 lg:gap-x-8">
        <PaginationPageSizeSelect table={table} />
        <PaginationInfo table={table} />
        <PaginationControls table={table} />
      </div>
    </div>
  );
}

// Export individual components for advanced composition
export {
  PaginationSelectedCount,
  PaginationPageSizeSelect,
  PaginationInfo,
  PaginationControls,
};
