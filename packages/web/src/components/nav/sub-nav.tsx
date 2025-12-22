import { Slot } from '@radix-ui/react-slot';
import type * as React from 'react';
import { cn } from '../../lib/utils';

const NavbarRoot = ({
  className,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
}) => (
  <div
    className={cn('flex h-[46px] items-center [&>*]:shrink-0', className)}
    ref={ref}
    {...props}
  >
    {children}
  </div>
);
NavbarRoot.displayName = 'NavbarRoot';

const NavbarItem = ({
  className,
  children,
  asChild = false,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
} & { ref?: React.Ref<HTMLDivElement> }) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      className={cn(
        'relative inline-block select-none border-transparent border-b-2 px-3 py-4 font-normal text-muted-foreground text-sm leading-[0.875rem] transition-colors duration-200 ease-out hover:bg-accent',
        '[&.active]:border-foreground [&.active]:text-foreground [&.active]:no-underline',
        className
      )}
      ref={ref}
      style={{ outlineOffset: '-6px' }}
      {...props}
    >
      {children}
    </Comp>
  );
};
NavbarItem.displayName = 'NavbarItem';

const Navbar = NavbarRoot;

export { Navbar, NavbarRoot, NavbarItem };
