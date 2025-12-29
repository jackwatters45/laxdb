import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { PageBody, PageContainer } from "@/components/layout/page-content";
import { TeamBreadcrumbSwitcher } from "@/components/nav/team-breadcrumb-switcher";
import {
  ContactInfoEdit,
  ContactInfoView,
} from "@/components/players/contact-info";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@laxdb/ui/components/ui/breadcrumb";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { PlayerHeader } from "./-components/player-header";
import { contactInfo } from "./-data-2";

export const Route = createFileRoute(
  "/_protected/$organizationSlug/$teamId/players/$playerId/contact-info",
)({
  component: ContactInfo,
  loader: () => ({ contactInfo }),
});

// FIX: update edit version
// FIX: backend
function ContactInfo() {
  const { contactInfo } = Route.useLoaderData();

  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <Header />
      <PageBody>
        <PageContainer>
          <Card>
            <CardHeader className="flex h-16 flex-row items-center justify-between space-y-0">
              <CardTitle>Contact Information</CardTitle>
              {!isEditing && (
                <Button
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <ContactInfoEdit
                  contactInfo={contactInfo}
                  setIsEditing={setIsEditing}
                />
              ) : (
                <ContactInfoView
                  contactInfo={contactInfo}
                  setIsEditing={setIsEditing}
                />
              )}
            </CardContent>
          </Card>
        </PageContainer>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();
  const { activeTeam, teams } = Route.useRouteContext();
  const { contactInfo } = Route.useLoaderData();

  return (
    <PlayerHeader
      organizationSlug={organizationSlug}
      playerId={contactInfo.publicPlayerId}
      teamId={activeTeam.id}
    >
      <BreadcrumbItem>
        <BreadcrumbLink
          className="max-w-full truncate"
          title="Teams"
          render={
            <Link params={{ organizationSlug }} to="/$organizationSlug" />
          }
        >
          Teams
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <TeamBreadcrumbSwitcher
        activeTeam={activeTeam}
        organizationSlug={organizationSlug}
        teams={teams}
      >
        {({ team }) => (
          <Link
            params={{
              organizationSlug,
              teamId: activeTeam.id,
              playerId: contactInfo.publicPlayerId,
            }}
            to="/$organizationSlug/$teamId/players/$playerId/contact-info"
          >
            {team.name}
          </Link>
        )}
      </TeamBreadcrumbSwitcher>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink
          title="Players"
          render={
            <Link
              params={{ organizationSlug, teamId: activeTeam.id }}
              to="/$organizationSlug/$teamId/players"
            />
          }
        >
          Players
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink
          title={contactInfo.name}
          render={
            <Link
              params={{
                organizationSlug,
                teamId: activeTeam.id,
                playerId: contactInfo.publicPlayerId,
              }}
              to="/$organizationSlug/$teamId/players/$playerId"
            />
          }
        >
          {contactInfo.name}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <BreadcrumbLink
          title={"Contact Info"}
          render={
            <Link
              params={{
                organizationSlug,
                teamId: activeTeam.id,
                playerId: contactInfo.publicPlayerId,
              }}
              to="/$organizationSlug/$teamId/players/$playerId/contact-info"
            />
          }
        >
          Contact Info
        </BreadcrumbLink>
      </BreadcrumbItem>
    </PlayerHeader>
  );
}
