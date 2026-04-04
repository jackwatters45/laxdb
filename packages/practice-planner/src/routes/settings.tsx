import { RpcApiClient } from "@laxdb/api-v2/client";
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
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { ArrowLeft, Clock, MapPin, Loader2, Check } from "lucide-react";
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

function SettingsPage() {
  const defaults = Route.useLoaderData();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [duration, setDuration] = useState(
    defaults.durationMinutes?.toString() ?? "",
  );
  const [location, setLocation] = useState(defaults.location ?? "");

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await saveDefaults({
      data: {
        durationMinutes: duration ? parseInt(duration, 10) : null,
        location: location || null,
      },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <h1 className="text-lg font-semibold text-foreground">Settings</h1>

      <div className="space-y-8">
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
                type="number"
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                }}
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
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                }}
                placeholder="e.g. Main Field"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="animate-spin" />
            ) : saved ? (
              <Check />
            ) : null}
            {saving ? "Saving\u2026" : saved ? "Saved" : "Save Defaults"}
          </Button>
        </div>
      </div>
    </div>
  );
}
