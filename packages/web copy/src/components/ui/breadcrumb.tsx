import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const Breadcrumb = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"nav"> & {
  separator?: React.ReactNode;
} & { ref?: React.Ref<HTMLElement> }) => (
  <nav aria-label="breadcrumb" ref={ref} {...props} />
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"ol"> & {
  ref?: React.Ref<HTMLOListElement>;
}) => (
  <ol
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-sm sm:gap-2.5",
      className,
    )}
    ref={ref}
    {...props}
  />
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & {
  ref?: React.Ref<HTMLLIElement>;
}) => (
  <li
    className={cn("inline-flex items-center gap-1.5", className)}
    ref={ref}
    {...props}
  />
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = ({
  asChild,
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"a"> & {
  asChild?: boolean;
} & { ref?: React.Ref<HTMLAnchorElement> }) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      className={cn("transition-colors hover:text-foreground", className)}
      ref={ref}
      {...props}
    />
  );
};
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<"span"> & {
  ref?: React.Ref<HTMLSpanElement>;
}) => (
  <span
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    ref={ref}
    {...props}
  />
);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    aria-hidden="true"
    className={cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className)}
    role="presentation"
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    role="presentation"
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

const BreadcrumbDropdown = DropdownMenu;
BreadcrumbDropdown.displayName = "BreadcrumbDropdown";

const BreadcrumbDropdownTrigger = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuTrigger> & {
  ref?: React.Ref<React.ComponentRef<typeof DropdownMenuTrigger>>;
}) => (
  <DropdownMenuTrigger
    className={cn(
      "flex items-center gap-1 p-0.5 transition-colors hover:text-foreground",
      className,
    )}
    ref={ref}
    {...props}
  >
    <ChevronsUpDown className="h-3 w-3" />
  </DropdownMenuTrigger>
);
BreadcrumbDropdownTrigger.displayName = "BreadcrumbDropdownTrigger";

const BreadcrumbDropdownContent = DropdownMenuContent;
BreadcrumbDropdownContent.displayName = "BreadcrumbDropdownContent";

const BreadcrumbDropdownItem = ({
  asChild,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
  asChild?: boolean;
} & {
  ref?: React.Ref<React.ComponentRef<typeof DropdownMenuItem>>;
}) => (
  <DropdownMenuItem
    {...(asChild !== undefined && { asChild })}
    {...(ref !== undefined && { ref })}
    {...props}
  />
);
BreadcrumbDropdownItem.displayName = "BreadcrumbDropdownItem";

const BreadcrumbDropdownLabel = DropdownMenuLabel;
BreadcrumbDropdownLabel.displayName = "BreadcrumbDropdownLabel";

const BreadcrumbDropdownSeparator = DropdownMenuSeparator;
BreadcrumbDropdownSeparator.displayName = "BreadcrumbDropdownSeparator";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbDropdown,
  BreadcrumbDropdownTrigger,
  BreadcrumbDropdownContent,
  BreadcrumbDropdownItem,
  BreadcrumbDropdownLabel,
  BreadcrumbDropdownSeparator,
};
