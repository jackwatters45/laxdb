import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@laxdb/ui/components/ui/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getFixture } from "../lib/matches";

type TeamSummary = {
  readonly id: string;
  readonly name: string;
};

type TeamNavigationProps = {
  readonly teams: ReadonlyArray<TeamSummary>;
};

const pathSegments = (pathname: string) =>
  pathname.split("/").filter((segment) => segment !== "");

const teamIdFromPath = (pathname: string) => {
  const segments = pathSegments(pathname);
  return segments[0] === "teams" ? (segments[1] ?? null) : null;
};

const fixtureIdFromPath = (pathname: string) => {
  const segments = pathSegments(pathname);
  if (segments[0] === "fixtures") return segments[1] ?? null;
  if (segments[0] === "teams" && segments[2] === "fixtures")
    return segments[3] ?? null;
  return null;
};

const teamSectionFromPath = (pathname: string) => {
  const segments = pathSegments(pathname);
  return segments[0] === "teams" ? (segments[2] ?? null) : null;
};

const teamSectionLabel = (section: string) => {
  if (section === "fixtures") return "Fixtures";
  if (section === "reports") return "Reports";
  if (section === "photos") return "Photos";
  if (section === "roster") return "Roster";
  if (section === "standings") return "Standings";
  if (section === "stats") return "Stats";
  return "Team";
};

const pageLabel = (pathname: string) => {
  if (pathname === "/teams" || pathname === "/teams/") return "Teams";
  if (pathname === "/fixtures") return "Fixtures";
  if (pathname.startsWith("/fixtures/")) return "Fixture";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/photos") return "Photos";
  if (pathname === "/roster") return "Roster";
  if (pathname === "/player") return "Player";
  if (pathname === "/profile") return "User settings";
  if (pathname === "/fines") return "Fines";
  if (pathname === "/audit") return "Audit";
  if (pathname === "/admin") return "Admin";
  return "Malvern Lacrosse";
};

export function AppBreadcrumbs({ teams }: TeamNavigationProps) {
  const { pathname } = useLocation();
  const teamId = teamIdFromPath(pathname);
  const fixtureId = fixtureIdFromPath(pathname);
  const teamSection = teamSectionFromPath(pathname);
  const team = teams.find((entry) => entry.id === teamId);
  const teamName = team?.name ?? "Team";
  const isFixture = fixtureId !== null;
  const fixtureQuery = useQuery({
    queryKey: ["fixture", fixtureId],
    queryFn: () =>
      fixtureId === null
        ? Promise.reject(new Error("Fixture ID is required"))
        : getFixture({ data: { id: fixtureId } }),
    enabled: isFixture,
  });
  const fixture = fixtureQuery.data;
  const fixtureTeam = teams.find((entry) => entry.id === fixture?.teamId);
  const fixtureLabel = fixture
    ? `${fixture.homeTeamName} vs ${fixture.awayTeamName}`
    : "Fixture";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {isFixture ? (
          <>
            <BreadcrumbItem>
              {fixtureTeam ? (
                <BreadcrumbLink
                  render={
                    <Link
                      to="/teams/$teamId"
                      params={{ teamId: fixtureTeam.id }}
                    />
                  }
                >
                  {fixtureTeam.name}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink render={<Link to="/fixtures" />}>
                  Fixtures
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {fixtureTeam ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link
                        to="/teams/$teamId/fixtures"
                        params={{ teamId: fixtureTeam.id }}
                      />
                    }
                  >
                    Fixtures
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage
                className="max-w-[min(50vw,28rem)] truncate"
                title={fixtureLabel}
              >
                {fixtureLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : teamId === null ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabel(pathname)}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : teamSection === null ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{teamName}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to="/teams/$teamId" params={{ teamId }} />}
              >
                {teamName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{teamSectionLabel(teamSection)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const teamNavLinkClass =
  "shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground data-[status=active]:bg-muted data-[status=active]:font-medium data-[status=active]:text-foreground";
const activeAnchorClass = "bg-muted font-medium text-foreground";
const fixtureSections = [
  { id: "details", label: "Details" },
  { id: "stats", label: "Game statistics" },
  { id: "report", label: "Match report" },
  { id: "photos", label: "Photos" },
] as const;

type FixtureSectionId = (typeof fixtureSections)[number]["id"];

function FixtureTopNavigation({ pathname }: { readonly pathname: string }) {
  const [activeSection, setActiveSection] =
    useState<FixtureSectionId>("details");

  useEffect(() => {
    let frame: number | null = null;
    const updateActiveSection = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let nextSection: FixtureSectionId = "details";
        const atPageEnd =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 64;
        if (atPageEnd) {
          for (const section of fixtureSections) {
            if (document.getElementById(section.id) !== null) {
              nextSection = section.id;
            }
          }
        } else {
          for (const section of fixtureSections) {
            const element = document.getElementById(section.id);
            if (
              element !== null &&
              element.getBoundingClientRect().top <= 112
            ) {
              nextSection = section.id;
            }
          }
        }
        setActiveSection(nextSection);
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    const observer = new MutationObserver(updateActiveSection);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <nav
      aria-label="Fixture sections"
      className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto border-t border-border px-3 py-2 sm:px-4"
    >
      {fixtureSections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={activeSection === section.id ? "location" : undefined}
          className={`${teamNavLinkClass} ${activeSection === section.id ? activeAnchorClass : ""}`}
          onClick={() => {
            setActiveSection(section.id);
          }}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}

export function AppTopNavigation() {
  const { pathname } = useLocation();
  if (fixtureIdFromPath(pathname) === null) return null;
  return <FixtureTopNavigation pathname={pathname} />;
}
