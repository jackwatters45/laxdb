import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@laxdb/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "cursor-pointer focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border border-transparent text-xs/relaxed font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-primary text-primary-foreground border-b border-b-black/5 dark:border-b-white/5 shadow-[0_1px_3px_0_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:shadow-[0_3px_8px_-2px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        outline:
          "rounded-lg border-border-strong hover:bg-accent/50 hover:border-foreground/25 hover:text-foreground hover:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)] aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "rounded-lg bg-white text-secondary-foreground border-border shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] hover:border-border-strong hover:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.08)] dark:bg-white/10 dark:hover:bg-white/15 aria-expanded:text-secondary-foreground",
        ghost:
          "rounded-lg hover:bg-accent hover:text-accent-foreground hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] dark:hover:bg-accent/60 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "rounded-lg bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        bracket:
          "corners-border corners-border-fixed border-foreground/10 hover:border-foreground/25 text-foreground",
        "bracket-ghost":
          "corners-border corners-border-fixed hover:border-foreground/20 text-foreground",
        "ghost-muted": "rounded-md text-muted-foreground hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-6 gap-1 px-1.5 text-xs/relaxed has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-5 gap-0.5 px-1 text-[0.6875rem]/relaxed has-data-[icon=inline-end]:pr-0.5 has-data-[icon=inline-start]:pl-0.5 [&_svg:not([class*='size-'])]:size-2.5",
        lg: "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
        xl: "h-10 gap-1.5 px-5 text-sm/4 tracking-wide has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-6 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-5 [&_svg:not([class*='size-'])]:size-2.5",
        "icon-lg": "size-7 [&_svg:not([class*='size-'])]:size-4",
        "icon-xl": "size-10 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
