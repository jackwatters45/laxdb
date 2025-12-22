import { createFileRoute, Link } from '@tanstack/react-router';
import { PageBody } from '@/components/layout/page-content';
import { JoinOrganizationForm } from '@/components/organizations/join-form';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import { BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/organization/join'
)({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  const { organizationSlug } = Route.useParams();

  return (
    <>
      <Header />
      <PageBody>
        <JoinOrganizationForm organizationSlug={organizationSlug} />
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <DashboardHeader>
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Join Organization">
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/organization/join"
          >
            Join Organization
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </DashboardHeader>
  );
}
