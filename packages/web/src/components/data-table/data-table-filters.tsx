'use client';

import {
  RiAddLine,
  RiArrowDownSLine,
  RiCornerDownRightLine,
} from '@remixicon/react';
import type { Column } from '@tanstack/react-table';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { focusRing } from '@/lib/tw';
import { cn } from '@/lib/utils';
import { useFilterBar } from './use-filterbar';

export type ConditionFilter = {
  condition: string;
  value: [number | string, number | string];
};

type SharedFilterProps<TData, TValue> = {
  column: Column<TData, TValue> | undefined;
  title?: string;
  options: {
    label: string;
    value: string;
  }[];
};

type ColumnFilterLabelProps = {
  columnFilterLabels: string[] | undefined;
  className?: string;
};

const ColumnFiltersLabel = ({
  columnFilterLabels,
  className,
}: ColumnFilterLabelProps) => {
  if (!columnFilterLabels) {
    return null;
  }

  if (columnFilterLabels.length < 3) {
    return (
      <span className={cn('truncate', className)}>
        {columnFilterLabels.map((value, index) => (
          <span className={cn('font-semibold text-primary')} key={value}>
            {value}
            {index < columnFilterLabels.length - 1 && ', '}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={cn('font-semibold text-primary', className)}>
      {columnFilterLabels[0]} and {columnFilterLabels.length - 1} more
    </span>
  );
};

type FilterSearchProps = {
  column: string;
  placeholder?: string;
  className?: string;
};

function FilterSearch({
  column,
  placeholder = 'Search...',
  className,
}: FilterSearchProps) {
  const { table } = useFilterBar();

  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    table.getColumn(column)?.setFilterValue(value);
  };

  return (
    <Input
      className={cn('h-7 w-full sm:max-w-[250px]', className)}
      onChange={handleSearchChange}
      placeholder={placeholder}
      value={searchTerm}
    />
  );
}

type FilterClearProps = { className?: string };

function FilterClear({ className }: FilterClearProps) {
  const { table } = useFilterBar();

  const isFiltered = table.getState().columnFilters.length > 0;

  if (!isFiltered) {
    return null;
  }

  return (
    <Button
      className={cn(
        'border border-border px-2 font-semibold text-primary sm:border-none sm:py-1',
        className
      )}
      onClick={() => table.resetColumnFilters()}
      size={'sm'}
      variant="ghost"
    >
      Clear filters
    </Button>
  );
}

// Individual filter components
type FilterSelectProps<TData, TValue> = SharedFilterProps<TData, TValue>;

function FilterSelect<TData, TValue>({
  column,
  title,
  options,
}: FilterSelectProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as string;
  const [selectedValues, setSelectedValues] = React.useState<string>(
    columnFilters || ''
  );
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues) {
      return;
    }
    return [selectedValues];
  }, [selectedValues]);

  React.useEffect(() => {
    setSelectedValues(columnFilters || '');
  }, [columnFilters]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium hover:bg-muted sm:w-fit sm:text-xs',
            selectedValues
              ? 'text-foreground'
              : 'border-dashed text-muted-foreground',
            focusRing
          )}
          type="button"
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues) {
                e.stopPropagation();
                column?.setFilterValue('');
                setSelectedValues('');
              }
            }}
          >
            <RiAddLine
              aria-hidden="true"
              className={cn(
                '-ml-px size-5 shrink-0 transition sm:size-4',
                selectedValues && 'rotate-45 hover:text-destructive'
              )}
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span aria-hidden="true" className="h-4 w-px bg-border" />
          )}
          <ColumnFiltersLabel
            className="w-full text-left sm:w-fit"
            columnFilterLabels={columnFilterLabels}
          />
          <RiArrowDownSLine
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground sm:size-4"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-[calc(var(--radix-popover-trigger-width))] max-w-[calc(var(--radix-popover-trigger-width))] sm:min-w-56 sm:max-w-56"
        onInteractOutside={() => {
          if (!columnFilters || columnFilters === '') {
            column?.setFilterValue('');
            setSelectedValues('');
          }
        }}
        sideOffset={7}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="font-medium text-base sm:text-sm">
                Filter by {title}
              </Label>
              <Select
                onValueChange={(value) => {
                  setSelectedValues(value);
                }}
                value={selectedValues}
              >
                <SelectTrigger className="mt-2 sm:py-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                className="w-full sm:py-1"
                onClick={() => {
                  column?.setFilterValue('');
                  setSelectedValues('');
                }}
                type="button"
                variant="secondary"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

type FilterCheckboxProps<TData, TValue> = SharedFilterProps<TData, TValue>;

function FilterCheckbox<TData, TValue>({
  column,
  title,
  options,
}: FilterCheckboxProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as string[];
  const [selectedValues, setSelectedValues] = React.useState<string[]>(
    columnFilters || []
  );
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues || selectedValues.length === 0) {
      return;
    }
    return selectedValues;
  }, [selectedValues]);

  React.useEffect(() => {
    setSelectedValues(columnFilters || []);
  }, [columnFilters]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-7 w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium text-sm hover:bg-muted sm:w-fit',
            selectedValues && selectedValues.length > 0
              ? 'text-foreground'
              : 'border-dashed text-muted-foreground',
            focusRing
          )}
          type="button"
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues && selectedValues.length > 0) {
                e.stopPropagation();
                column?.setFilterValue([]);
                setSelectedValues([]);
              }
            }}
          >
            <RiAddLine
              aria-hidden="true"
              className={cn(
                '-ml-px size-5 shrink-0 transition sm:size-4',
                selectedValues &&
                  selectedValues.length > 0 &&
                  'rotate-45 hover:text-destructive'
              )}
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span aria-hidden="true" className="h-4 w-px bg-border" />
          )}
          <ColumnFiltersLabel
            className="w-full text-left sm:w-fit"
            columnFilterLabels={columnFilterLabels}
          />
          <RiArrowDownSLine
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground sm:size-4"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-[calc(var(--radix-popover-trigger-width))] max-w-[calc(var(--radix-popover-trigger-width))] sm:min-w-56 sm:max-w-56"
        onInteractOutside={() => {
          if (!columnFilters || columnFilters.length === 0) {
            column?.setFilterValue([]);
            setSelectedValues([]);
          }
        }}
        sideOffset={7}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="font-semibold text-base sm:text-sm">
                Filter by {title}
              </Label>
              <div className="mt-2 space-y-2 overflow-y-auto sm:max-h-40">
                {options.map((option) => (
                  <div className="flex items-center gap-2" key={option.label}>
                    <Checkbox
                      checked={selectedValues?.includes(option.value)}
                      id={option.value}
                      onCheckedChange={(checked) => {
                        setSelectedValues((prev) => {
                          if (checked) {
                            return prev
                              ? [...prev, option.value]
                              : [option.value];
                          }
                          return prev.filter((value) => value !== option.value);
                        });
                      }}
                    />
                    <Label
                      className="text-base sm:text-sm"
                      htmlFor={option.value}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                className="w-full sm:py-1"
                onClick={() => {
                  column?.setFilterValue([]);
                  setSelectedValues([]);
                }}
                type="button"
                variant="secondary"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

type FilterNumberProps<TData, TValue> = SharedFilterProps<TData, TValue> & {
  formatter?: (value: string | number) => string;
};

function FilterNumber<TData, TValue>({
  column,
  title,
  options,
  formatter = (value: string | number) => value.toString(),
}: FilterNumberProps<TData, TValue>) {
  const columnFilters = column?.getFilterValue() as ConditionFilter;
  const [selectedValues, setSelectedValues] = React.useState<ConditionFilter>(
    columnFilters || { condition: '', value: ['', ''] }
  );
  const [open, setOpen] = React.useState(false);

  const columnFilterLabels = React.useMemo(() => {
    if (!selectedValues || selectedValues.condition === '') {
      return;
    }

    const condition = options.find(
      (option) => option.value === selectedValues.condition
    )?.label;
    if (!condition) {
      return;
    }
    if (!(selectedValues.value?.[0] || selectedValues.value?.[1])) {
      return [`${condition}`];
    }
    if (!selectedValues.value?.[1]) {
      return [`${condition} ${formatter(selectedValues.value?.[0])}`];
    }
    return [
      `${condition} ${formatter(selectedValues.value?.[0])} and ${formatter(
        selectedValues.value?.[1]
      )}`,
    ];
  }, [selectedValues, options, formatter]);

  React.useEffect(() => {
    setSelectedValues(columnFilters || { condition: '', value: ['', ''] });
  }, [columnFilters]);

  const isBetween = selectedValues?.condition === 'is-between';

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-x-1.5 whitespace-nowrap rounded-md border border-border px-2 py-1.5 font-medium hover:bg-muted sm:w-fit sm:text-xs',
            selectedValues && selectedValues.condition !== ''
              ? 'text-foreground'
              : 'border-dashed text-muted-foreground',
            focusRing
          )}
          type="button"
        >
          <span
            aria-hidden="true"
            onClick={(e) => {
              if (selectedValues && selectedValues.condition !== '') {
                e.stopPropagation();
                column?.setFilterValue({ condition: '', value: ['', ''] });
                setSelectedValues({ condition: '', value: ['', ''] });
              }
            }}
          >
            <RiAddLine
              aria-hidden="true"
              className={cn(
                '-ml-px size-5 shrink-0 transition sm:size-4',
                selectedValues &&
                  selectedValues.condition !== '' &&
                  'rotate-45 hover:text-destructive'
              )}
            />
          </span>
          {columnFilterLabels && columnFilterLabels.length > 0 ? (
            <span>{title}</span>
          ) : (
            <span className="w-full text-left sm:w-fit">{title}</span>
          )}
          {columnFilterLabels && columnFilterLabels.length > 0 && (
            <span aria-hidden="true" className="h-4 w-px bg-border" />
          )}
          <ColumnFiltersLabel
            className="w-full text-left sm:w-fit"
            columnFilterLabels={columnFilterLabels}
          />
          <RiArrowDownSLine
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground sm:size-4"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-[calc(var(--radix-popover-trigger-width))] max-w-[calc(var(--radix-popover-trigger-width))] sm:min-w-56 sm:max-w-56"
        onInteractOutside={() => {
          if (!columnFilters || columnFilters.condition === '') {
            column?.setFilterValue({ condition: '', value: ['', ''] });
            setSelectedValues({ condition: '', value: ['', ''] });
          }
        }}
        sideOffset={7}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            column?.setFilterValue(selectedValues);
            setOpen(false);
          }}
        >
          <div className="space-y-2">
            <div>
              <Label className="font-medium text-base sm:text-sm">
                Filter by {title}
              </Label>
              <div className="space-y-2">
                <Select
                  onValueChange={(value) => {
                    setSelectedValues((prev) => ({
                      condition: value,
                      value: [value !== '' ? prev?.value?.[0] || '' : '', ''],
                    }));
                  }}
                  value={selectedValues?.condition}
                >
                  <SelectTrigger className="mt-2 sm:py-1">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex w-full items-center gap-2">
                  <RiCornerDownRightLine
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <Input
                    className="sm:[&>input]:py-1"
                    disabled={!selectedValues?.condition}
                    onChange={(e) => {
                      setSelectedValues((prev) => ({
                        condition: prev?.condition || '',
                        value: [
                          e.target.value,
                          isBetween ? prev?.value?.[1] || '' : '',
                        ],
                      }));
                    }}
                    placeholder="$0"
                    type="number"
                    value={selectedValues?.value?.[0] || ''}
                  />
                  {selectedValues?.condition === 'is-between' && (
                    <>
                      <span className="font-medium text-muted-foreground text-xs">
                        and
                      </span>
                      <Input
                        className="sm:[&>input]:py-1"
                        disabled={!selectedValues?.condition}
                        onChange={(e) => {
                          setSelectedValues((prev) => ({
                            condition: prev?.condition || '',
                            value: [prev?.value?.[0] || '', e.target.value],
                          }));
                        }}
                        placeholder="$0"
                        type="number"
                        value={selectedValues?.value?.[1] || ''}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
            {columnFilterLabels && columnFilterLabels.length > 0 && (
              <Button
                className="w-full sm:py-1"
                onClick={() => {
                  column?.setFilterValue({ condition: '', value: ['', ''] });
                  setSelectedValues({ condition: '', value: ['', ''] });
                }}
                type="button"
                variant="secondary"
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export {
  FilterCheckbox,
  FilterClear,
  FilterNumber,
  FilterSearch,
  FilterSelect,
};
