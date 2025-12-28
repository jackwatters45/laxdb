import { createFileRoute, Link } from "@tanstack/react-router";
import { PageBody } from "@/components/layout/page-content";
import { CreateOrganizationForm } from "@/components/organizations/create-form";
import { DashboardHeader } from "@/components/sidebar/dashboard-header";
import {
  BreadcrumbItem,
  BreadcrumbLink,
} from "@laxdb/ui/components/ui/breadcrumb";

export const Route = createFileRoute(
  "/_protected/$organizationSlug/organization/create",
)({
  component: CreateOrganizationPage,
});

function CreateOrganizationPage() {
  const { organizationSlug } = Route.useParams();

  return (
    <>
      <Header />
      <PageBody>
        <CreateOrganizationForm organizationSlug={organizationSlug} />
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <DashboardHeader>
      <BreadcrumbItem>
        <BreadcrumbLink
          title="Create Organization"
          render={
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/organization/create"
            />
          }
        >
          Create Organization
        </BreadcrumbLink>
      </BreadcrumbItem>
    </DashboardHeader>
  );
}
