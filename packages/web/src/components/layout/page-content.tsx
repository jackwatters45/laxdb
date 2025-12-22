import { cn } from '@/lib/utils';

type PageBodyProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * PageBody component for the scrollable content area.
 * Use this to wrap the main content that should scroll.
 */
export function PageBody({ children, className }: PageBodyProps) {
  return (
    <div className={cn('flex-1 overflow-auto', className)}>{children}</div>
  );
}

/**
 * PageBody component for the standardized padding.
 * Use this to wrap the content within the PageBody.
 */
export function PageContainer({ children, className }: PageBodyProps) {
  return (
    <div className={cn('container mx-auto py-8', className)}>{children}</div>
  );
}
