import type { RowSelectionState, Table } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { Copy, Edit, Trash2, UserMinus, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type BulkEditActions = {
  onRemove?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

type BulkEditContextValue<TData = unknown> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
  selectedCount: number;
  actions?: BulkEditActions;
};

const BulkEditContext = React.createContext<BulkEditContextValue | null>(null);

function useBulkEdit<TData = unknown>(): BulkEditContextValue<TData> {
  const context = React.use(BulkEditContext);
  if (!context) {
    throw new Error("useBulkEdit must be used within a BulkEditProvider");
  }
  return context as BulkEditContextValue<TData>;
}

type BulkEditProviderProps<TData> = {
  table: Table<TData>;
  rowSelection: RowSelectionState;
  actions?: BulkEditActions;
  children: React.ReactNode;
};

function BulkEditProvider<TData>({
  table,
  rowSelection,
  actions,
  children,
}: BulkEditProviderProps<TData>) {
  const selectedCount = Object.keys(rowSelection).length;

  const value = React.useMemo(
    () => ({
      table,
      rowSelection,
      selectedCount,
      actions,
    }),
    [table, rowSelection, selectedCount, actions],
  );

  return (
    <BulkEditContext.Provider value={value as BulkEditContextValue}>
      {children}
    </BulkEditContext.Provider>
  );
}

type BulkEditToolbarProps = {
  children: React.ReactNode;
  className?: string;
};

type BulkEditToolbarCountProps = {
  className?: string;
};

type BulkEditToolbarClearProps = {
  className?: string;
};

type BulkEditToolbarActionsProps = {
  children: React.ReactNode;
  className?: string;
};

type BulkEditToolbarActionProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  className?: string | undefined;
};

function BulkEditToolbar({ children, className }: BulkEditToolbarProps) {
  const { selectedCount } = useBulkEdit();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="slide-in-from-bottom-4 fixed right-0 bottom-4 left-0 z-50 flex animate-in justify-center duration-300">
        <div
          className={cn(
            "max-w-2xl rounded-3xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm",
            className,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function BulkEditToolbarCount({ className }: BulkEditToolbarCountProps) {
  const { selectedCount } = useBulkEdit();

  return (
    <Badge
      className={cn(
        "border-accent bg-accent px-2 py-0.5 text-foreground text-xs",
        className,
      )}
      variant="outline"
    >
      {selectedCount}
    </Badge>
  );
}

function BulkEditToolbarClear({ className }: BulkEditToolbarClearProps) {
  const { table } = useBulkEdit();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            className={cn(
              "h-6 w-6 p-0 text-muted-foreground hover:text-foreground",
              className,
            )}
            onClick={() => {
              table.resetRowSelection();
            }}
            size="sm"
            variant="ghost"
          />
        }
      >
        <X className="h-3 w-3" />
      </TooltipTrigger>
      <TooltipContent>Clear selection</TooltipContent>
    </Tooltip>
  );
}

function BulkEditToolbarSelection({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <BulkEditToolbarCount />
      <BulkEditToolbarClear />
    </div>
  );
}

function BulkEditToolbarActions({
  children,
  className,
}: BulkEditToolbarActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>{children}</div>
  );
}

function BulkEditToolbarAction({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  className,
}: BulkEditToolbarActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            className={cn(
              "h-7 w-7 p-0",
              variant === "destructive" &&
                "text-destructive hover:text-destructive",
              className,
            )}
            onClick={onClick}
            size="sm"
            variant="ghost"
          />
        }
      >
        <Icon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function BulkEditToolbarSeparator() {
  return <Separator className="h-4" orientation="vertical" />;
}

function BulkEditToolbarEditAction({ className }: { className?: string }) {
  const { actions } = useBulkEdit();

  if (!actions?.onEdit) {
    throw new Error(
      "BulkEditToolbarEditAction requires onEdit action to be provided to BulkEditProvider",
    );
  }

  return (
    <BulkEditToolbarAction
      className={className}
      icon={Edit}
      label="Edit"
      onClick={actions.onEdit}
    />
  );
}

function BulkEditToolbarDeleteAction({ className }: { className?: string }) {
  const { actions, selectedCount } = useBulkEdit();

  if (!actions?.onDelete) {
    throw new Error(
      "BulkEditToolbarDeleteAction requires onDelete action to be provided to BulkEditProvider",
    );
  }

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <AlertDialogTrigger
              render={
                <Button
                  className={cn("h-7 w-7 p-0", className)}
                  size="sm"
                  variant="ghost"
                />
              }
            />
          }
        >
          <Trash2 className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Delete Permanently</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {selectedCount}{" "}
            {selectedCount === 1 ? "item" : "items"}. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={actions.onDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BulkEditToolbarRemoveAction({
  className,
  icon,
  tooltipContent,
}: {
  className?: string;
  icon?: LucideIcon;
  tooltipContent?: string;
}) {
  const { actions, selectedCount } = useBulkEdit();

  if (!actions?.onRemove) {
    throw new Error(
      "BulkEditToolbarRemoveAction requires onRemove action to be provided to BulkEditProvider",
    );
  }

  const Icon = icon ?? UserMinus;

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <AlertDialogTrigger
              render={
                <Button
                  className={cn("h-7 w-7 p-0", className)}
                  size="sm"
                  variant="ghost"
                />
              }
            />
          }
        >
          <Icon className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>{tooltipContent ?? "Remove"}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from team?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {selectedCount}{" "}
            {selectedCount === 1 ? "player" : "players"} from this team. The
            player records will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={actions.onRemove}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BulkEditToolbarCopyAction({
  className,
  icon,
  tooltipContent,
  columnId,
}: {
  className?: string;
  icon?: LucideIcon;
  tooltipContent?: string;
  columnId: string;
}) {
  const { table } = useBulkEdit();
  const Icon = icon ?? Copy;

  const handleCopy = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const values = selectedRows
      .map((row) => {
        const value = row.getValue(columnId);
        return value ? String(value) : "";
      })
      .filter(Boolean);

    if (values.length === 0) {
      toast.error("No values to copy");
      return;
    }

    const text = values.join(", ");
    await navigator.clipboard.writeText(text);
    toast.success(
      `Copied ${values.length} ${values.length === 1 ? "value" : "values"}`,
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            className={cn("h-7 w-7 p-0", className)}
            onClick={handleCopy}
            size="sm"
            variant="ghost"
          />
        }
      >
        <Icon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>{tooltipContent ?? "Copy"}</TooltipContent>
    </Tooltip>
  );
}

export {
  BulkEditProvider,
  BulkEditToolbar,
  BulkEditToolbarCount,
  BulkEditToolbarClear,
  BulkEditToolbarSelection,
  BulkEditToolbarActions,
  BulkEditToolbarAction,
  BulkEditToolbarEditAction,
  BulkEditToolbarDeleteAction,
  BulkEditToolbarRemoveAction,
  BulkEditToolbarCopyAction,
  BulkEditToolbarSeparator,
};
