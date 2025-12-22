'use client';

import { RiFilterLine } from '@remixicon/react';
import type { Column } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from './data-table-column-header';

type FacetedColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  options: {
    label: string;
    value: string;
    count: number;
  }[];
};

export function FacetedColumnHeader<TData, TValue>({
  column,
  title,
  options,
}: FacetedColumnHeaderProps<TData, TValue>) {
  const _facets = column.getFacetedUniqueValues();
  const selectedValues = new Set(column.getFilterValue() as string[]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="-ml-3 h-8 data-[state=open]:bg-accent"
          size="sm"
          variant="ghost"
        >
          <DataTableColumnHeader
            className="hover:bg-transparent"
            column={column}
            title={title}
          />
          <Separator className="h-4" orientation="vertical" />
          {selectedValues?.size > 0 && (
            <Badge
              className="ml-2 rounded-sm px-1 font-normal lg:hidden"
              variant="secondary"
            >
              {selectedValues.size}
            </Badge>
          )}
          <RiFilterLine
            className={cn(
              'h-3 w-3',
              selectedValues?.size > 0
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <ScrollArea className="max-h-[300px] overflow-y-auto p-2">
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value);
            return (
              <div
                className="flex items-center space-x-2 p-2"
                key={option.value}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectedValues.add(option.value);
                    } else {
                      selectedValues.delete(option.value);
                    }
                    const filterValues = Array.from(selectedValues);
                    column.setFilterValue(
                      filterValues.length ? filterValues : undefined
                    );
                  }}
                />
                <div className="flex flex-1 items-center justify-between">
                  <span>{option.label}</span>
                  <span className="text-muted-foreground">{option.count}</span>
                </div>
              </div>
            );
          })}
        </ScrollArea>
        {selectedValues.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                className="w-full"
                onClick={() => column.setFilterValue(undefined)}
                size="sm"
                variant="outline"
              >
                Clear filters
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
