import { Button } from "@laxdb/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@laxdb/ui/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@laxdb/ui/components/ui/popover";
import { cn } from "@laxdb/ui/lib/utils";
import { Check, ChevronDownIcon, ChevronsUpDown } from "lucide-react";
import * as React from "react";

type SearchComboboxContextValue<TItem> = {
  items: TItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedValue?: string;
  onSelect: (item: TItem) => void;
  getItemValue: (item: TItem) => string;
  open: boolean;
  setOpen: (open: boolean) => void;
  closeOnSelect: boolean;
};

const SearchComboboxContext = React.createContext<SearchComboboxContextValue<unknown> | null>(null);

function useSearchCombobox<TItem>(): SearchComboboxContextValue<TItem> {
  const context = React.useContext(SearchComboboxContext);
  if (!context) {
    throw new Error("useSearchCombobox must be used within a SearchComboboxProvider");
  }
  return context as SearchComboboxContextValue<TItem>;
}

type SearchComboboxProviderProps<TItem> = {
  items: TItem[];
  isLoading?: boolean;
  value?: string | undefined;
  onSelect: (item: TItem) => void;
  getItemValue: (item: TItem) => string;
  closeOnSelect?: boolean;
  children: React.ReactNode;
};

function SearchComboboxProvider<TItem>({
  items,
  isLoading = false,
  value,
  onSelect,
  getItemValue,
  closeOnSelect = true,
  children,
}: SearchComboboxProviderProps<TItem>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const contextValue = React.useMemo(
    () => ({
      items,
      isLoading,
      searchQuery,
      setSearchQuery,
      selectedValue: value,
      onSelect,
      getItemValue,
      open,
      setOpen,
      closeOnSelect,
    }),
    [items, isLoading, searchQuery, value, onSelect, getItemValue, open, closeOnSelect],
  );

  return (
    <SearchComboboxContext.Provider value={contextValue as SearchComboboxContextValue<unknown>}>
      {children}
    </SearchComboboxContext.Provider>
  );
}

type SearchComboboxRootProps = {
  children: React.ReactNode;
};

function SearchComboboxRoot({ children }: SearchComboboxRootProps) {
  const { open, setOpen } = useSearchCombobox();

  return (
    <Popover onOpenChange={setOpen} open={open}>
      {children}
    </Popover>
  );
}

type SearchComboboxTriggerProps = {
  placeholder?: string;
  className?: string;
};

function SearchComboboxTrigger({
  placeholder = "Select...",
  className,
}: SearchComboboxTriggerProps) {
  const { selectedValue, open } = useSearchCombobox();

  return (
    <PopoverTrigger
      render={
        <Button
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between border-0 px-2 font-normal hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            className,
          )}
          role="combobox"
          variant="ghost"
        />
      }
    >
      <span className={cn(!selectedValue && "text-muted-foreground")}>
        {selectedValue ?? placeholder}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </PopoverTrigger>
  );
}

type SearchComboboxContentProps = {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
};

function SearchComboboxContent({
  children,
  align = "start",
  className,
}: SearchComboboxContentProps) {
  return (
    <PopoverContent align={align} className={cn("w-[300px] p-0", className)}>
      <Command shouldFilter={false}>{children}</Command>
    </PopoverContent>
  );
}

type SearchComboboxInputProps = {
  placeholder?: string;
};

function SearchComboboxInput({ placeholder = "Search..." }: SearchComboboxInputProps) {
  const { searchQuery, setSearchQuery } = useSearchCombobox();

  return (
    <CommandInput onValueChange={setSearchQuery} placeholder={placeholder} value={searchQuery} />
  );
}

type SearchComboboxListProps = {
  children: React.ReactNode;
};

function SearchComboboxList({ children }: SearchComboboxListProps) {
  return <CommandList>{children}</CommandList>;
}

type SearchComboboxLoadingProps = {
  children?: React.ReactNode;
};

function SearchComboboxLoading({ children = "Loading..." }: SearchComboboxLoadingProps) {
  return <div className="py-6 text-center text-sm">{children}</div>;
}

type SearchComboboxEmptyProps = {
  children?: React.ReactNode | ((query: string) => React.ReactNode);
};

function SearchComboboxEmpty({ children = "No results found." }: SearchComboboxEmptyProps) {
  const { searchQuery } = useSearchCombobox();

  return (
    <CommandEmpty>{typeof children === "function" ? children(searchQuery) : children}</CommandEmpty>
  );
}

type SearchComboboxGroupProps = {
  heading?: string;
  children: React.ReactNode;
};

function SearchComboboxGroup({ heading, children }: SearchComboboxGroupProps) {
  return <CommandGroup heading={heading}>{children}</CommandGroup>;
}

type SearchComboboxItemProps<TItem> = {
  item: TItem;
  children: (item: TItem, isSelected: boolean) => React.ReactNode;
};

function SearchComboboxItem<TItem>({ item, children }: SearchComboboxItemProps<TItem>) {
  const { selectedValue, onSelect, setOpen, setSearchQuery, getItemValue, closeOnSelect } =
    useSearchCombobox<TItem>();

  const itemValue = getItemValue(item);
  const isSelected = selectedValue === itemValue;

  return (
    <CommandItem
      onSelect={() => {
        onSelect(item);
        if (closeOnSelect) {
          setOpen(false);
          setSearchQuery("");
        }
      }}
      value={itemValue}
    >
      {!closeOnSelect && (
        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
      )}
      {children(item, isSelected)}
    </CommandItem>
  );
}

function SearchComboboxSeparator() {
  return <CommandSeparator />;
}

type SearchComboboxActionProps = {
  onSelect: () => void;
  children: React.ReactNode;
};

function SearchComboboxAction({ onSelect, children }: SearchComboboxActionProps) {
  const { setOpen, setSearchQuery, closeOnSelect } = useSearchCombobox();

  return (
    <CommandItem
      onSelect={() => {
        onSelect();
        if (closeOnSelect) {
          setOpen(false);
          setSearchQuery("");
        }
      }}
    >
      {children}
    </CommandItem>
  );
}

type MultiSearchComboboxFooterContext = {
  searchQuery: string;
  selectedValues: readonly string[];
  setSelectedValues: (values: readonly string[]) => void;
  close: () => void;
};

type MultiSearchComboboxProps<TItem> = {
  items: readonly TItem[];
  selectedValues: readonly string[];
  onSelectedValuesChange: (values: readonly string[]) => void;
  getItemValue: (item: TItem) => string;
  getItemLabel: (item: TItem) => string;
  renderItem?: (item: TItem, isSelected: boolean) => React.ReactNode;
  selectedSummary?: (selectedValues: readonly string[]) => React.ReactNode;
  footerSummary?: (selectedValues: readonly string[]) => React.ReactNode;
  renderFooterActions?: (context: MultiSearchComboboxFooterContext) => React.ReactNode;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: React.ReactNode;
  searchPlaceholder?: string;
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  noResultsMessage?: (query: string) => React.ReactNode;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  listClassName?: string;
  align?: "start" | "center" | "end";
};

function MultiSearchCombobox<TItem>({
  items,
  selectedValues,
  onSelectedValuesChange,
  getItemValue,
  getItemLabel,
  renderItem,
  selectedSummary,
  footerSummary,
  renderFooterActions,
  label,
  description,
  placeholder = "Search/select options",
  searchPlaceholder = "Search...",
  loading = false,
  loadingMessage = "Loading…",
  emptyMessage = "No options available.",
  noResultsMessage = (query) => `No results match “${query}”.`,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  listClassName,
  align = "start",
}: MultiSearchComboboxProps<TItem>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const listboxId = React.useId();

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const visibleItems = React.useMemo(() => {
    if (normalizedSearch === "") return items;
    return items.filter((item) =>
      getItemLabel(item).toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [getItemLabel, items, normalizedSearch]);

  const toggleValue = React.useCallback(
    (value: string) => {
      onSelectedValuesChange(
        selectedValues.includes(value)
          ? selectedValues.filter((selectedValue) => selectedValue !== value)
          : [...selectedValues, value],
      );
    },
    [onSelectedValuesChange, selectedValues],
  );

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  const triggerContent = selectedSummary
    ? selectedSummary(selectedValues)
    : selectedValues.length === 0
      ? placeholder
      : `${selectedValues.length} selected`;

  const footerContent = footerSummary
    ? footerSummary(selectedValues)
    : selectedValues.length === 0
      ? "No selections."
      : `${selectedValues.length} selected.`;

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="lg"
              role="combobox"
              aria-controls={listboxId}
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn("w-full justify-between text-left font-normal", triggerClassName)}
              disabled={disabled}
            />
          }
        >
          <span className={cn("truncate", selectedValues.length === 0 && "text-muted-foreground")}>
            {triggerContent}
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align={align}
          role="presentation"
          className={cn("w-[min(38rem,calc(100vw-2rem))] gap-2 p-2", contentClassName)}
        >
          {(label || description) && (
            <div className="space-y-1 px-1 pt-1">
              {label && <p className="text-xs font-medium text-foreground">{label}</p>}
              {description && (
                <p className="text-[0.6875rem]/relaxed text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          <Command shouldFilter={false}>
            <CommandInput
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder={searchPlaceholder}
            />
            <CommandList
              id={listboxId}
              role="listbox"
              aria-multiselectable="true"
              className={cn("max-h-80 rounded-lg border bg-background p-1", listClassName)}
            >
              {loading ? (
                <div className="px-3 py-6 text-xs text-muted-foreground">{loadingMessage}</div>
              ) : items.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs/relaxed text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : visibleItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs/relaxed text-muted-foreground">
                  {noResultsMessage(searchQuery.trim())}
                </div>
              ) : (
                visibleItems.map((item) => {
                  const value = getItemValue(item);
                  const isSelected = selectedValues.includes(value);
                  return (
                    <CommandItem
                      key={value}
                      value={value}
                      role="option"
                      aria-selected={isSelected}
                      data-checked={isSelected}
                      onSelect={() => {
                        toggleValue(value);
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        {renderItem ? renderItem(item, isSelected) : getItemLabel(item)}
                      </span>
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
            <span>{footerContent}</span>
            <div className="flex flex-wrap gap-1">
              {renderFooterActions ? (
                renderFooterActions({
                  searchQuery,
                  selectedValues,
                  setSelectedValues: onSelectedValuesChange,
                  close,
                })
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      onSelectedValuesChange([]);
                    }}
                  >
                    Clear
                  </Button>
                  <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={close}>
                    Done
                  </Button>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export {
  MultiSearchCombobox,
  SearchComboboxProvider,
  SearchComboboxRoot,
  SearchComboboxTrigger,
  SearchComboboxContent,
  SearchComboboxInput,
  SearchComboboxList,
  SearchComboboxLoading,
  SearchComboboxEmpty,
  SearchComboboxGroup,
  SearchComboboxItem,
  SearchComboboxSeparator,
  SearchComboboxAction,
  useSearchCombobox,
};
