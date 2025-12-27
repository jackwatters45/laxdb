import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        data: "absolute inset-0 h-full rounded-0 rounded-none border-none px-2 py-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

function Input({
  className,
  variant,
  type,
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      className={cn(inputVariants({ variant, className }))}
      ref={ref}
      type={type}
      {...props}
    />
  );
}
Input.displayName = "Input";

export interface ControlledInput extends Omit<InputProps, "defaultValue"> {
  onUpdate: (value: string | null) => void;
}

function ControlledInput({
  value,
  onUpdate,
  ref,
  ...props
}: ControlledInput & { ref?: React.Ref<HTMLInputElement> }) {
  const [localValue, setLocalValue] = React.useState(value?.toString() ?? "");

  return (
    <Input
      {...props}
      onBlur={() => {
        onUpdate(localValue);
      }}
      onChange={(e) => {
        setLocalValue(e.target.value);
      }}
      {...(ref !== undefined && { ref })}
      value={localValue}
    />
  );
}

export { ControlledInput, Input };
