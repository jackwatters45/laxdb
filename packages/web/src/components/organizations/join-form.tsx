import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { OrganizationService } from "@laxdb/core/organization/organization.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { useMutation } from "@tanstack/react-query";
import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { Effect, Schema } from "effect";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { PageContainer } from "../layout/page-content";

const AcceptInvitationSchema = Schema.Struct({
  invitationId: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Invitation code is required" }),
    Schema.minLength(10, {
      message: () => "Invitation code must be at least 10 characters",
    }),
  ),
});
type FormData = typeof AcceptInvitationSchema.Type;

const acceptInvitation = createServerFn({ method: "POST" })
  .inputValidator((data: typeof AcceptInvitationSchema.Type) =>
    Schema.decodeSync(AcceptInvitationSchema)(data),
  )
  .handler(({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const organizationService = yield* OrganizationService;

        const headers = getRequestHeaders();

        return yield* organizationService.acceptInvitation(data, headers);
      }),
    ),
  );

export function JoinOrganizationForm({
  organizationSlug,
}: {
  organizationSlug?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const form = useForm<FormData>({
    resolver: effectTsResolver(AcceptInvitationSchema),
    defaultValues: {
      invitationId: "",
    },
  });

  // Use React Query mutation for joining organization
  const joinOrgMutation = useMutation({
    mutationKey: ["acceptInvitation"],
    mutationFn: (data: FormData) => acceptInvitation({ data }),
    onSuccess: () => {
      toast.success("Successfully joined the organization!");
      // router.navigate({
      //   to: '/$organizationSlug',
      //   params: { organizationSlug },
      // });
    },
    onError: (_error) => {
      toast.error(
        "Failed to join organization. Please check your invitation code.",
      );
    },
  });

  const onSubmit = (data: FormData) => {
    joinOrgMutation.mutate(data);
  };

  return (
    <PageContainer className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">Join Athletic Club</h1>
        <p className="text-muted-foreground">
          Enter the invitation code you received to join an existing club
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <p className="text-muted-foreground text-sm">
            You should have received an invitation code via email from your club
            administrator
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="invitationId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="invitation-code">
                      Invitation Code
                    </FieldLabel>
                    <Input
                      {...field}
                      id="invitation-code"
                      placeholder="Enter your invitation code"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      This is usually a long string of letters and numbers
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
                <Button
                  render={
                    <Link
                      onClick={(e) => {
                        if (canGoBack) {
                          e.preventDefault();
                          router.history.back();
                        }
                      }}
                      params={{ organizationSlug }}
                      to="/$organizationSlug"
                    />
                  }
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              ) : null}
              <Button disabled={joinOrgMutation.isPending} type="submit">
                {joinOrgMutation.isPending ? "Joining..." : "Join Club"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
