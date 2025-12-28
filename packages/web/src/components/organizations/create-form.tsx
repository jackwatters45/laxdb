import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { CreateOrganizationInput } from "@laxdb/core/organization/organization.schema";
import { OrganizationService } from "@laxdb/core/organization/organization.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { useMutation } from "@tanstack/react-query";
import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";
import { Schema } from "effect";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-content";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { authMiddleware } from "@/lib/middleware";

const createOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateOrganizationInput.Type) =>
    Schema.decodeSync(CreateOrganizationInput)(data),
  )
  .handler(({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const organizationService = yield* OrganizationService;
        return yield* organizationService.createOrganization(
          data,
          context.headers,
        );
      }),
    ),
  );

type FormData = typeof CreateOrganizationInput.Type;

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .slice(0, 50);

export function CreateOrganizationForm({
  organizationSlug,
}: {
  organizationSlug?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const form = useForm<FormData>({
    resolver: effectTsResolver(CreateOrganizationInput),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: FormData) => createOrganization({ data }),
    onSuccess: async (result, variables) => {
      await router.invalidate();
      router.navigate({
        to: "/$organizationSlug/$teamId/setup",
        params: { organizationSlug: variables.slug, teamId: result.teamId },
      });
    },
    onError: (error, variables) => {
      if (error.message === "Slug is not available") {
        toast.error(
          `Slug "${variables.slug}" is not available. Please try a different slug.`,
        );
      } else {
        toast.error("Failed to create organization. Please try again.");
      }
    },
  });

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    form.setValue("slug", slug);
  };

  const onSubmit = (data: FormData) => {
    createOrgMutation.mutate(data);
  };

  return (
    <PageContainer className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">Create Your Athletic Club</h1>
        <p className="text-muted-foreground">
          Set up your organization to start managing teams and players
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          >
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="org-name">Club Name</FieldLabel>
                    <Input
                      {...field}
                      id="org-name"
                      placeholder="e.g., Malvern Lacrosse Club"
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="org-slug">Club Slug (URL)</FieldLabel>
                    <Input
                      {...field}
                      id="org-slug"
                      placeholder="malvern-lacrosse-club"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      This will be used in your club&apos;s URL
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <div className="flex gap-4 pt-4">
              {organizationSlug ? (
                <Button asChild type="button" variant="outline">
                  <Link
                    onClick={(e) => {
                      if (canGoBack) {
                        e.preventDefault();
                        router.history.back();
                      }
                    }}
                    params={{ organizationSlug }}
                    to="/$organizationSlug"
                  >
                    Cancel
                  </Link>
                </Button>
              ) : null}
              <Button disabled={createOrgMutation.isPending} type="submit">
                {createOrgMutation.isPending ? "Creating..." : "Create Club"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
