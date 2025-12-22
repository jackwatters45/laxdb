import { createFileRoute, Link } from '@tanstack/react-router';
import ReactMarkdown from 'react-markdown';
import { PageBody } from '@/components/layout/page-content';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import { BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import planningContent from '@/content/planning.md?raw';

export const Route = createFileRoute('/_protected/$organizationSlug/plan')({
  component: Home,
});

function Home() {
  return (
    <>
      <Header />
      <PageBody>
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-6 border-border border-b pb-2 font-bold text-3xl text-foreground">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-8 mb-4 font-semibold text-2xl text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-6 mb-3 font-semibold text-foreground text-xl">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 list-inside list-disc space-y-2 text-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 list-inside list-decimal space-y-2 text-foreground">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground">{children}</li>
                ),
                p: ({ children }) => (
                  <p className="mb-4 text-foreground leading-relaxed">
                    {children}
                  </p>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-primary border-l-4 bg-muted/50 py-2 pl-4 text-muted-foreground italic">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-muted px-2 py-1 font-mono text-foreground text-sm">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-foreground">
                    {children}
                  </pre>
                ),
                a: ({ href, children }) => (
                  <a
                    className="text-primary underline decoration-primary/30 transition-colors hover:text-primary-hover hover:decoration-primary/60"
                    href={href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {children}
                  </a>
                ),
                hr: () => <hr className="my-8 border-border" />,
              }}
            >
              {planningContent}
            </ReactMarkdown>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <DashboardHeader>
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Plan">
          <Link params={{ organizationSlug }} to="/$organizationSlug/plan">
            Plan
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </DashboardHeader>
  );
}
