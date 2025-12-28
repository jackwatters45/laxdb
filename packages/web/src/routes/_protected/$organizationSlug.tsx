import { AuthService } from "@laxdb/core/auth";
import { OrganizationOperationError } from "@laxdb/core/organization/organization.error";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { OrganizationSlugSchema } from "@laxdb/core/schema";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { Effect, Schema } from "effect";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@laxdb/ui/components/ui/sidebar";
import { authMiddleware } from "@/lib/middleware";

const GetDashboardDataSchema = Schema.Struct({
  ...OrganizationSlugSchema,
});

const getDashboardData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof GetDashboardDataSchema.Type) =>
    Schema.decodeSync(GetDashboardDataSchema)(data),
  )
  .handler(({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;
        if (!context.session?.user) {
          return {
            organizations: [],
            activeOrganization: null,
            sidebarOpen: true,
          };
        }

        const headers = context.headers;

        const [organizations, activeOrganization] = yield* Effect.all(
          [
            Effect.tryPromise(() =>
              auth.auth.api.listOrganizationTeams({ headers }),
            ).pipe(
              Effect.mapError(
                (cause) =>
                  new OrganizationOperationError({
                    message: "Failed to list organization teams",
                    cause,
                  }),
              ),
            ),
            Effect.tryPromise(() =>
              auth.auth.api.getFullOrganization({ headers }),
            ).pipe(
              Effect.mapError(
                (cause) =>
                  new OrganizationOperationError({
                    message: "Failed to retrieve active organization",
                    cause,
                  }),
              ),
            ),
          ],
          { concurrency: "unbounded" },
        );

        const cookie = getRequestHeader("Cookie");
        const match = cookie?.match(/sidebar_state=([^;]+)/);
        const sidebarOpen = match?.[1] !== "false";

        return {
          organizations,
          activeOrganization,
          sidebarOpen,
        };
      }),
    ),
  );

export const Route = createFileRoute("/_protected/$organizationSlug")({
  beforeLoad: async ({ location, params }) => {
    const data = await getDashboardData({
      data: { organizationSlug: params.organizationSlug },
    });

    const activeOrganization = data.activeOrganization;
    if (!activeOrganization) {
      throw redirect({
        to: "/organization/create",
        search: {
          redirectUrl: location.pathname || "/teams",
        },
      });
    }

    return {
      organizations: data.organizations,
      activeOrganization,
      sidebarOpen: data.sidebarOpen,
    };
  },
  loader: ({ params }) =>
    getDashboardData({
      data: { organizationSlug: params.organizationSlug },
    }),
  component: OrganizationLayout,
});

function OrganizationLayout() {
  const { sidebarOpen } = Route.useRouteContext();

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar />
      <SidebarInset className="flex h-screen flex-col">
        <div className="flex h-full flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
