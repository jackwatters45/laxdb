import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@laxdb/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const inputVariants = cva(
  "bg-input/20 dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-7 rounded-md border px-2 py-0.5 text-sm transition-colors file:h-6 file:text-xs/relaxed file:font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] md:text-xs/relaxed file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
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
  extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

function Input({ className, type, variant, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  );
}

export interface ControlledInputProps extends Omit<InputProps, "defaultValue"> {
  onUpdate: (value: string | null) => void;
}

function ControlledInput({
  value,
  onUpdate,
  ref,
  ...props
}: ControlledInputProps & { ref?: React.Ref<HTMLInputElement> }) {
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

export { Input, ControlledInput };
