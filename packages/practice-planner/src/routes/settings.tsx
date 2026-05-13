import { RpcApiClient } from "@laxdb/api/client";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@laxdb/ui/components/ui/field";
import { Input } from "@laxdb/ui/components/ui/input";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Clock, MapPin, Loader2, Check } from "lucide-react";
import { useState } from "react";

import { runApi } from "@/lib/api";
import { decodePracticeDefaults, practiceDefaultsScope } from "@/lib/defaults";

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const loadDefaults = createServerFn({ method: "GET" }).handler(() =>
  runApi(
    Effect.gen(function* () {
      const client = yield* RpcApiClient;
      const values = yield* client.DefaultsGetNamespace(practiceDefaultsScope);
      return decodePracticeDefaults(values);
    }),
  ),
);

const UpsertDefaultsForm = Schema.Struct({
  durationMinutes: Schema.NullOr(Schema.Number),
  location: Schema.NullOr(Schema.String),
});

const saveDefaults = createServerFn({ method: "POST" })
  .inputValidator((data: typeof UpsertDefaultsForm.Type) =>
    Schema.decodeSync(UpsertDefaultsForm)(data),
  )
  .handler(({ data }) =>
    runApi(
      Effect.gen(function* () {
        const client = yield* RpcApiClient;
        const values = yield* client.DefaultsPatchNamespace({
          ...practiceDefaultsScope,
          values: {
            durationMinutes: data.durationMinutes,
            location: data.location,
          },
        });
        return decodePracticeDefaults(values);
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  loader: () => loadDefaults(),
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const getFormString = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value : "";

function SettingsPage() {
  const defaults = Route.useLoaderData();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) => {
    e.preventDefault();

    void (async () => {
      const fd = new FormData(e.currentTarget);
      const raw = getFormString(fd.get("durationMinutes"));
      const loc = getFormString(fd.get("location"));

      setSaving(true);
      setSaved(false);
      await saveDefaults({
        data: {
          durationMinutes: raw ? parseInt(raw, 10) : null,
          location: loc || null,
        },
      });
      await router.invalidate();
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    })();
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <FieldSet>
          <FieldLegend>Practice Defaults</FieldLegend>
          <FieldDescription className="-mt-1.5">
            Set default values for new practices. These will be pre-filled when
            you create a new practice.
          </FieldDescription>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="default-duration">
                <Clock size={12} />
                Default Duration (minutes)
              </FieldLabel>
              <Input
                id="default-duration"
                name="durationMinutes"
                type="number"
                key={`dur-${defaults.durationMinutes}`}
                defaultValue={defaults.durationMinutes?.toString() ?? ""}
                placeholder="120"
                min={15}
                max={300}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="default-location">
                <MapPin size={12} />
                Default Location
              </FieldLabel>
              <Input
                id="default-location"
                name="location"
                key={`loc-${defaults.location}`}
                defaultValue={defaults.location ?? ""}
                placeholder="e.g. Main Field"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex items-center justify-between">
          <Link to="/">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : saved ? (
              <Check />
            ) : null}
            {saving ? "Saving\u2026" : saved ? "Saved" : "Save Defaults"}
          </Button>
        </div>
      </form>
    </div>
  );
}
