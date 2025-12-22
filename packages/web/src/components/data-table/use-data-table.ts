import type { ColumnDef, Table } from '@tanstack/react-table';
import React from 'react';

type DataTableContextValue<TData = unknown> = {
  table: Table<TData>;
  columns: ColumnDef<TData>[];
};

const DataTableContext =
  React.createContext<DataTableContextValue<unknown> | null>(null);

function useDataTable<TData = unknown>(): DataTableContextValue<TData> {
  const context = React.use(DataTableContext);
  if (!context) {
    throw new Error('useDataTable must be used within a DataTableProvider');
  }
  return context as DataTableContextValue<TData>;
}

export { type DataTableContextValue, DataTableContext, useDataTable };
