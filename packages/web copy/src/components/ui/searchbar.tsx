import { RiSearchLine } from "@remixicon/react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface SearchbarProps extends React.ComponentProps<"input"> {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Searchbar = ({
  className,
  placeholder = "Search...",
  ref,
  ...props
}: SearchbarProps & { ref?: React.Ref<HTMLInputElement> }) => (
  <div className="relative">
    <RiSearchLine className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
    <Input
      className={cn("h-8 pl-9", className)}
      placeholder={placeholder}
      {...(ref !== undefined && { ref })}
      type="search"
      {...props}
    />
  </div>
);
Searchbar.displayName = "Searchbar";

export { Searchbar };
