import { RiEqualizer2Line } from "@remixicon/react";
import type { Table } from "@tanstack/react-table";
import { Grid2X2, List } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ButtonGroup } from "../ui/button-group";
import { TabsList, TabsTrigger } from "../ui/tabs";
import {
  type FilterBarActions,
  FilterBarContext,
  type FilterBarContextValue,
  useFilterBar,
} from "./use-filterbar";

type FilterBarProviderProps<TData = unknown> = {
  table: Table<TData>;
  actions?: FilterBarActions;
  children?: React.ReactNode;
};

function FilterBarProvider<TData>({
  table,
  actions,
  children,
}: FilterBarProviderProps<TData>) {
  const value = React.useMemo(
    () => ({
      table,
      actions,
    }),
    [table, actions],
  );

  return (
    <FilterBarContext.Provider value={value as FilterBarContextValue}>
      {children}
    </FilterBarContext.Provider>
  );
}

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
};

function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 px-4 sm:gap-x-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

type FilterGroupProps = {
  children: React.ReactNode;
  className?: string;
};

function FilterGroup({ children, className }: FilterGroupProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

function FilterActions({ children, className }: FilterGroupProps) {
  return (
    <ButtonGroup className={cn("flex items-center gap-2", className)}>
      {children}
    </ButtonGroup>
  );
}

function FilterBarViewOptions() {
  const { table } = useFilterBar();
  const columns = table.getAllColumns();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          // className="ml-auto flex h-7 gap-x-2 text-sm sm:text-xs"
        >
          <RiEqualizer2Line aria-hidden="true" className="size-4" />
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-50 w-fit space-y-2"
        sideOffset={7}
      >
        <Label className="font-semibold">Display Properties</Label>
        <div className="mt-2 flex flex-col space-y-2">
          {columns.map((column) => {
            if (!column.getCanHide()) {
              return null;
            }
            const label =
              (column.columnDef.meta?.displayName as string) || column.id;
            return (
              <div
                className="flex items-center gap-2 overflow-y-auto rounded-sm text-sm hover:bg-accent hover:text-accent-foreground"
                key={column.id}
              >
                <Checkbox
                  aria-label={`Toggle ${label} column visibility`}
                  checked={column.getIsVisible()}
                  id={column.id}
                  onCheckedChange={(value) => {
                    column.toggleVisibility(!!value);
                  }}
                />
                <Label
                  className="cursor-pointer font-normal text-sm"
                  htmlFor={column.id}
                >
                  {label}
                </Label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type FilterBarAddButtonProps = React.PropsWithChildren & {
  className?: string;
};

function FilterBarAddButton({ children, className }: FilterBarAddButtonProps) {
  const { actions } = useFilterBar();

  return (
    <Button className={className} onClick={actions?.onAdd} size={"sm"}>
      {children}
    </Button>
  );
}

function FilterBarDisplayTypeToggle() {
  return (
    <TabsList>
      <TabsTrigger value="list">
        <List className="size-4" />
      </TabsTrigger>
      <TabsTrigger value="cards">
        <Grid2X2 className="size-4" />
      </TabsTrigger>
    </TabsList>
  );
}

export {
  FilterCheckbox,
  FilterClear,
  FilterNumber,
  FilterSearch,
  FilterSelect,
} from "./data-table-filters";

export {
  FilterActions,
  FilterBar,
  FilterBarProvider,
  FilterGroup,
  FilterBarViewOptions,
  FilterBarDisplayTypeToggle,
  FilterBarAddButton,
};
