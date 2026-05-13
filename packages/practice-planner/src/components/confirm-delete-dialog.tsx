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
} from "@laxdb/ui/components/ui/alert-dialog";
import { Button } from "@laxdb/ui/components/ui/button";
import { voidAsync } from "@laxdb/ui/lib/void-async";
import type { ReactElement, ReactNode } from "react";

interface ConfirmDeleteDialogProps {
  title: string;
  description: ReactNode;
  onConfirm: () => Promise<unknown> | void;
  trigger: ReactElement;
  children: ReactNode;
  confirmLabel?: string;
}

export function ConfirmDeleteDialog({
  title,
  description,
  onConfirm,
  trigger,
  children,
  confirmLabel = "Delete",
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            render={<Button variant="destructive" />}
            onClick={voidAsync(onConfirm)}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
