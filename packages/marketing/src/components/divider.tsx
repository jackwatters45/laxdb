// Tremor Divider [v0.0.2]

import type React from 'react';

import { cn } from '@/lib/utils';

type DividerProps = React.ComponentPropsWithoutRef<'div'>;

const Divider = ({
  className,
  children,
  ref: forwardedRef,
  ...props
}: DividerProps & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    className={cn(
      // base
      'mx-auto my-6 flex w-full items-center justify-between gap-3 text-sm',
      // text color
      'text-gray-500',
      className
    )}
    ref={forwardedRef}
    tremor-id="tremor-raw"
    {...props}
  >
    {children ? (
      <>
        <div
          className={cn(
            // base
            'h-[1px] w-full',
            // background color
            'bg-linear-to-r from-transparent to-gray-200'
          )}
        />
        <div className="whitespace-nowrap text-inherit">{children}</div>
        <div
          className={cn(
            // base
            'h-[1px] w-full',
            // background color
            'bg-linear-to-l from-transparent to-gray-200'
          )}
        />
      </>
    ) : (
      <div
        className={cn(
          // base
          'h-[1px] w-full',
          // background color
          'bg-linear-to-l from-transparent via-gray-200 to-transparent'
        )}
      />
    )}
  </div>
);

Divider.displayName = 'Divider';

export { Divider };
