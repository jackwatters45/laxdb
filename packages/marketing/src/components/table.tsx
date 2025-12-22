// Tremor Table [v0.0.3]

import type React from 'react';

import { cn } from '@/lib/utils';

const TableRoot = ({
  className,
  children,
  ref: forwardedRef,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => (
  <div
    ref={forwardedRef}
    // Activate if table is used in a float environment
    // className="flow-root"
  >
    <div
      // make table scrollable on mobile
      className={cn('w-full whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </div>
  </div>
);

TableRoot.displayName = 'TableRoot';

const Table = ({
  className,
  ref: forwardedRef,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & {
  ref?: React.RefObject<HTMLTableElement | null>;
}) => (
  <table
    className={cn(
      // base
      'w-full caption-bottom border-b',
      // border color
      'border-gray-200',
      className
    )}
    ref={forwardedRef}
    tremor-id="tremor-raw"
    {...props}
  />
);

Table.displayName = 'Table';

const TableHead = ({
  className,
  ref: forwardedRef,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.RefObject<HTMLTableSectionElement | null>;
}) => <thead className={cn(className)} ref={forwardedRef} {...props} />;

TableHead.displayName = 'TableHead';

const TableHeaderCell = ({
  className,
  ref: forwardedRef,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  ref?: React.RefObject<HTMLTableCellElement | null>;
}) => (
  <th
    className={cn(
      // base
      'border-b px-4 py-3.5 text-left text-sm font-semibold',
      // text color
      'text-gray-900',
      // border color
      'border-gray-200',
      className
    )}
    ref={forwardedRef}
    {...props}
  />
);

TableHeaderCell.displayName = 'TableHeaderCell';

const TableBody = ({
  className,
  ref: forwardedRef,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.RefObject<HTMLTableSectionElement | null>;
}) => (
  <tbody
    className={cn(
      // base
      'divide-y',
      // divide color
      'divide-gray-200',
      className
    )}
    ref={forwardedRef}
    {...props}
  />
);

TableBody.displayName = 'TableBody';

const TableRow = ({
  className,
  ref: forwardedRef,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & {
  ref?: React.RefObject<HTMLTableRowElement | null>;
}) => (
  <tr
    className={cn(
      '[&_td:last-child]:pr-4 [&_th:last-child]:pr-4',
      '[&_td:first-child]:pl-4 [&_th:first-child]:pl-4',
      className
    )}
    ref={forwardedRef}
    {...props}
  />
);

TableRow.displayName = 'TableRow';

const TableCell = ({
  className,
  ref: forwardedRef,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  ref?: React.RefObject<HTMLTableCellElement | null>;
}) => (
  <td
    className={cn(
      // base
      'p-4 text-sm',
      // text color
      'text-gray-600',
      className
    )}
    ref={forwardedRef}
    {...props}
  />
);

TableCell.displayName = 'TableCell';

const TableFoot = ({
  className,
  ref: forwardedRef,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & {
  ref?: React.RefObject<HTMLTableSectionElement | null>;
}) => {
  return (
    <tfoot
      className={cn(
        // base
        'border-t text-left font-medium',
        // text color
        'text-gray-900',
        // border color
        'border-gray-200',
        className
      )}
      ref={forwardedRef}
      {...props}
    />
  );
};

TableFoot.displayName = 'TableFoot';

const TableCaption = ({
  className,
  ref: forwardedRef,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement> & {
  ref?: React.RefObject<HTMLTableCaptionElement | null>;
}) => (
  <caption
    className={cn(
      // base
      'mt-3 px-3 text-center text-sm',
      // text color
      'text-gray-500',
      className
    )}
    ref={forwardedRef}
    {...props}
  />
);

TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
};
