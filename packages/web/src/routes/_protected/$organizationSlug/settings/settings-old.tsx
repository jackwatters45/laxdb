import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { AuthService } from '@laxdb/core/auth';
import { RuntimeServer } from '@laxdb/core/runtime.server';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authMiddleware } from '@/lib/middleware';

// Server function to delete organization and set new active org
const deleteOrganization = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data, context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;

        const headers = context.headers;

        try {
          // Get user's organizations before deleting
          const organizationsResult = yield* Effect.tryPromise(() =>
            auth.auth.api.listOrganizations({ headers })
          );

          // Check if this is the last organization
          if (organizationsResult.length <= 1) {
            return {
              success: false,
              error:
                'Cannot delete your last organization. You must have at least one organization.',
            };
          }

          // Delete the organization
          yield* Effect.tryPromise(() =>
            auth.auth.api.deleteOrganization({
              body: { organizationId: data.organizationId },
              headers,
            })
          );

          // Find remaining organizations (excluding the one we just deleted)
          const remainingOrgs = organizationsResult.filter(
            (org) => org.id !== data.organizationId
          );

          // Set the first remaining organization as active
          if (remainingOrgs && remainingOrgs.length > 0) {
            yield* Effect.tryPromise(() =>
              auth.auth.api.setActiveOrganization({
                body: { organizationId: remainingOrgs[0]?.id },
                headers,
              })
            );
          }

          return { success: true, redirectPath: '/teams' };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to delete organization',
          };
        }
      })
    )
  );

// Server function to get dashboard data including organization count
const getDashboardData = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService;

        try {
          const [organization, organizations] = yield* Effect.all([
            Effect.tryPromise(() =>
              auth.auth.api.getFullOrganization({ headers: context.headers })
            ),
            Effect.tryPromise(() =>
              auth.auth.api.listOrganizations({ headers: context.headers })
            ),
          ]);

          return {
            organization,
            canDeleteOrganization: organizations.length > 1,
            organizationCount: organizations.length,
          };
        } catch (_error) {
          return {
            organization: null,
            canDeleteOrganization: false,
            organizationCount: 0,
          };
        }
      })
    )
  );

export const Route = createFileRoute(
  '/_protected/$organizationSlug/settings/settings-old'
)({
  component: SettingsPage,
  loader: async () => await getDashboardData(),
});

// Form schema for confirmation
const confirmDeleteSchema = Schema.Struct({
  confirmText: Schema.String.pipe(
    Schema.minLength(1, {
      message: () => 'Please enter the organization name',
    })
  ),
});

type ConfirmDeleteForm = typeof confirmDeleteSchema.Type;

function SettingsPage() {
  const { organization, canDeleteOrganization, organizationCount } =
    Route.useLoaderData();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteOrganization = async (values: ConfirmDeleteForm) => {
    if (!organization || values.confirmText !== organization.name) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOrganization({
        data: { organizationId: organization.id },
      });

      if (result.success) {
        // Redirect based on server response
        window.location.href = result.redirectPath || '/';
      } else {
        toast.error(result.error || 'Failed to delete organization');
      }
    } catch (_error) {
      toast.error('Failed to delete organization. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">No organization found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Current organization: {organization.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {organization.name}
              </div>
              <div>
                <span className="font-medium">Slug:</span> {organization.slug}
              </div>
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(organization.createdAt).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Total Organizations:</span>{' '}
                <span
                  className={organizationCount === 1 ? 'text-yellow-600' : ''}
                >
                  {organizationCount}
                </span>
                {organizationCount === 1 && (
                  <span className="ml-1 text-xs text-yellow-600">
                    (minimum required)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">Delete Organization</h3>
              <p className="mb-3 text-muted-foreground text-sm">
                Permanently delete this organization and all associated data.
                This action cannot be undone.
              </p>
              {!canDeleteOrganization && (
                <div className="mb-3 flex items-start gap-2 rounded-md border-yellow-500 border-l-4 bg-yellow-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm text-yellow-800">
                      Cannot Delete Last Organization
                    </p>
                    <p className="text-xs text-yellow-700">
                      You must have at least one organization. Create another
                      organization before deleting this one.
                    </p>
                  </div>
                </div>
              )}
              <Button
                className="gap-2"
                disabled={!canDeleteOrganization}
                onClick={() => setShowConfirmDialog(true)}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete Organization
                {!canDeleteOrganization && ' (Last Organization)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && organization && canDeleteOrganization && (
        <ConfirmDeleteDialog
          isDeleting={isDeleting}
          onCancel={() => setShowConfirmDialog(false)}
          onConfirm={handleDeleteOrganization}
          organization={organization}
        />
      )}
    </div>
  );
}

function ConfirmDeleteDialog({
  organization,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  organization: { name: string };
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (values: ConfirmDeleteForm) => Promise<void>;
}) {
  const form = useForm<ConfirmDeleteForm>({
    resolver: effectTsResolver(
      confirmDeleteSchema.pipe(
        Schema.filter((data) => data.confirmText === organization.name, {
          message: () => `Please type "${organization.name}" exactly`,
        })
      )
    ),
    defaultValues: {
      confirmText: '',
    },
  });

  const handleSubmit = async (values: ConfirmDeleteForm) => {
    await onConfirm(values);
    form.reset();
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h2 className="font-semibold text-lg">Delete Organization</h2>
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-sm">
            This action will permanently delete the organization{' '}
            <strong>{organization.name}</strong> and all associated data.
          </p>
          <p className="text-sm">
            This includes all teams, games, players, and other data. This action
            cannot be undone.
          </p>
        </div>

        <Form {...form}>
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="confirmText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type <strong>{organization.name}</strong> to confirm:
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      disabled={isDeleting}
                      placeholder={organization.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={isDeleting}
                onClick={handleCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={isDeleting || !form.formState.isValid}
                type="submit"
                variant="destructive"
              >
                {isDeleting ? 'Deleting...' : 'Delete Organization'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
