import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { OrganizationService } from "@laxdb/core/organization/organization.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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
        const organiationService = yield* OrganizationService;
        const request = getRequest();
        return yield* organiationService.acceptInvitation(
          data,
          request.headers,
        );
      }),
    ),
  );

export const Route = createFileRoute("/_protected/organization/join")({
  component: JoinOrganizationPage,
});

function JoinOrganizationPage() {
  const form = useForm<FormData>({
    resolver: effectTsResolver(AcceptInvitationSchema),
    defaultValues: {
      invitationId: "",
    },
  });

  const joinOrgMutation = useMutation({
    mutationKey: ["acceptInvitation"],
    mutationFn: (data: FormData) => acceptInvitation({ data }),
    onSuccess: () => {
      toast.success("Successfully joined the organization!");
    },
    onError: () => {
      toast.error(
        "Failed to join organization. Please check your invitation code.",
      );
    },
  });

  const onSubmit = (data: FormData) => {
    joinOrgMutation.mutate(data);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Join Athletic Club</h1>
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
          <form
            className="space-y-6"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          >
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
              <Button
                className="flex-1"
                disabled={joinOrgMutation.isPending}
                type="submit"
              >
                {joinOrgMutation.isPending ? "Joining..." : "Join Club"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
