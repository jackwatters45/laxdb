import type { RemixiconComponentType } from "@remixicon/react";
import { RiDeleteBinLine, RiEdit2Line, RiMoreFill } from "@remixicon/react";
import type { Row } from "@tanstack/react-table";
import { UserMinus } from "lucide-react";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ClassNameChildrenProp } from "@/types";

type RowActions<TData = unknown> = {
  onEdit?: (row: Row<TData>) => void;
  onDelete?: (row: Row<TData>) => void;
  onRemove?: (row: Row<TData>) => void;
};

type RowActionsContextValue<TData = unknown> = {
  row: Row<TData>;
  actions?: RowActions<TData>;
};

const RowActionsContext = React.createContext<RowActionsContextValue | null>(
  null,
);

function useRowActions<TData = unknown>(): RowActionsContextValue<TData> {
  const context = React.useContext(RowActionsContext);
  if (!context) {
    throw new Error("useRowActions must be used within a RowActionsProvider");
  }
  return context as RowActionsContextValue<TData>;
}

type RowActionsProviderProps<TData> = {
  row: Row<TData>;
  actions?: RowActions<TData>;
  children: React.ReactNode;
};

function RowActionsProvider<TData>({
  row,
  actions,
  children,
}: RowActionsProviderProps<TData>) {
  const value = React.useMemo(
    () => ({
      row,
      actions,
    }),
    [row, actions],
  );

  return (
    <RowActionsContext.Provider value={value as RowActionsContextValue}>
      {children}
    </RowActionsContext.Provider>
  );
}

type RowActionsDropdownProps = {
  children: React.ReactNode;
  className?: string;
};

function RowActionsDropdown({ children, className }: RowActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "group aspect-square p-1.5 hover:border hover:border-border data-[state=open]:border-border data-[state=open]:bg-muted",
            className,
          )}
          variant="ghost"
        >
          <RiMoreFill
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground group-data-[state=open]:text-foreground"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type RowActionItemProps = {
  icon?: RemixiconComponentType;
  children: React.ReactNode;
  onClick?: (() => void) | undefined;
  variant?: "default" | "destructive";
  className?: string | undefined;
};

function RowActionItem({
  icon: Icon,
  children,
  onClick,
  variant = "default",
  className,
}: RowActionItemProps) {
  return (
    <DropdownMenuItem
      className={cn(
        "gap-2",
        variant === "destructive" && "text-destructive focus:text-destructive",
        className,
      )}
      onClick={onClick}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </DropdownMenuItem>
  );
}

function RowActionEditItem({ className, children }: ClassNameChildrenProp) {
  const { actions, row } = useRowActions();

  if (!actions?.onEdit) {
    throw new Error(
      "RowActionEditItem requires onEdit action to be provided to RowActionsProvider",
    );
  }

  return (
    <RowActionItem
      className={className}
      icon={RiEdit2Line}
      onClick={() => actions.onEdit?.(row)}
    >
      {children}
    </RowActionItem>
  );
}

function RowActionDeleteItem({
  children,
  ...props
}: Omit<RowActionAlertItemProps, "icon" | "onClick" | "variant">) {
  const { actions, row } = useRowActions();

  if (!actions?.onDelete) {
    throw new Error(
      "RowActionDeleteItem requires onDelete action to be provided to RowActionsProvider",
    );
  }

  return (
    <RowActionAlertItem
      {...props}
      icon={RiDeleteBinLine}
      onClick={() => actions.onDelete?.(row)}
      variant="destructive"
    >
      {children}
    </RowActionAlertItem>
  );
}

function RowActionRemoveItem({
  children,
  ...props
}: Omit<RowActionAlertItemProps, "icon" | "onClick">) {
  const { actions, row } = useRowActions();

  if (!actions?.onRemove) {
    throw new Error(
      "RowActionAlertItem requires onRemove action to be provided to RowActionsProvider",
    );
  }

  return (
    <RowActionAlertItem
      {...props}
      icon={UserMinus}
      onClick={() => actions.onRemove?.(row)}
      variant="destructive"
    >
      {children}
    </RowActionAlertItem>
  );
}

type RowActionAlertItemProps = {
  icon?: RemixiconComponentType;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive";
  className?: string;
  alertTitle: string;
  alertDescription: string;
  alertActionText?: string;
  alertCancelText?: string;
};

function RowActionAlertItem({
  icon: Icon,
  children,
  onClick,
  className,
  alertTitle,
  alertDescription,
  variant = "default",
  alertActionText = "Continue",
  alertCancelText = "Cancel",
}: RowActionAlertItemProps) {
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className={cn("gap-2", className)}
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
          <AlertDialogDescription>{alertDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{alertCancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={handleConfirm}
          >
            {alertActionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RowActionSeparator() {
  return <DropdownMenuSeparator />;
}

export {
  RowActionsProvider,
  RowActionsDropdown,
  RowActionItem,
  RowActionAlertItem,
  RowActionEditItem,
  RowActionDeleteItem,
  RowActionRemoveItem,
  RowActionSeparator,
};
