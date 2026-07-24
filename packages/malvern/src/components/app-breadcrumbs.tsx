import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@laxdb/ui/components/ui/breadcrumb";
import { Link, useLocation } from "@tanstack/react-router";

const pageLabel = (pathname: string) => {
  if (pathname === "/teams" || pathname.startsWith("/teams/")) return "Teams";
  if (pathname === "/fixtures") return "Fixtures";
  if (pathname.startsWith("/fixtures/")) return "Match report";
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

export function AppBreadcrumbs() {
  const { pathname } = useLocation();
  const isMatchReport = pathname.startsWith("/fixtures/");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {isMatchReport ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/fixtures" />}>
                Fixtures
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}
        <BreadcrumbItem>
          <BreadcrumbPage>{pageLabel(pathname)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
