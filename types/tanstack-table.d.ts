import type { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        className?: string;
        displayName: string;
    }
    interface TableMeta<TData extends RowData> {
        excludePlayerIds?: string[];
    }
}
//# sourceMappingURL=tanstack-table.d.ts.map
