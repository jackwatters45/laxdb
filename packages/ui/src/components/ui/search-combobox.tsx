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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@laxdb/ui/components/ui/popover";
import { cn } from "@laxdb/ui/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
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

const SearchComboboxContext =
  React.createContext<SearchComboboxContextValue<unknown> | null>(null);

function useSearchCombobox<TItem>(): SearchComboboxContextValue<TItem> {
  const context = React.useContext(SearchComboboxContext);
  if (!context) {
    throw new Error(
      "useSearchCombobox must be used within a SearchComboboxProvider",
    );
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

// FIX: needs work when we need a multi-select
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
    [
      items,
      isLoading,
      searchQuery,
      value,
      onSelect,
      getItemValue,
      open,
      closeOnSelect,
    ],
  );

  return (
    <SearchComboboxContext.Provider
      value={contextValue as SearchComboboxContextValue<unknown>}
    >
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

function SearchComboboxInput({
  placeholder = "Search...",
}: SearchComboboxInputProps) {
  const { searchQuery, setSearchQuery } = useSearchCombobox();

  return (
    <CommandInput
      onValueChange={setSearchQuery}
      placeholder={placeholder}
      value={searchQuery}
    />
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

function SearchComboboxLoading({
  children = "Loading...",
}: SearchComboboxLoadingProps) {
  return <div className="py-6 text-center text-sm">{children}</div>;
}

type SearchComboboxEmptyProps = {
  children?: React.ReactNode | ((query: string) => React.ReactNode);
};

function SearchComboboxEmpty({
  children = "No results found.",
}: SearchComboboxEmptyProps) {
  const { searchQuery } = useSearchCombobox();

  return (
    <CommandEmpty>
      {typeof children === "function" ? children(searchQuery) : children}
    </CommandEmpty>
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

function SearchComboboxItem<TItem>({
  item,
  children,
}: SearchComboboxItemProps<TItem>) {
  const {
    selectedValue,
    onSelect,
    setOpen,
    setSearchQuery,
    getItemValue,
    closeOnSelect,
  } = useSearchCombobox<TItem>();

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
        <Check
          className={cn(
            "mr-2 h-4 w-4",
            isSelected ? "opacity-100" : "opacity-0",
          )}
        />
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

function SearchComboboxAction({
  onSelect,
  children,
}: SearchComboboxActionProps) {
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

export {
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
