import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@laxdb/ui/lib/utils";

function NavbarRoot({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn("flex h-[46px] items-center [&>*]:shrink-0", className),
      },
      props,
    ),
    ...(render && { render }),
  });
}

function NavbarItem({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "relative inline-block border-b-2 border-transparent px-3 py-4 text-sm leading-[0.875rem] font-normal text-muted-foreground transition-colors duration-200 ease-out select-none hover:bg-accent",
          "[&.active]:border-foreground [&.active]:text-foreground [&.active]:no-underline",
          className,
        ),
        style: { outlineOffset: "-6px" },
      },
      props,
    ),
    render,
  });
}

const Navbar = NavbarRoot;

export { Navbar, NavbarRoot, NavbarItem };
