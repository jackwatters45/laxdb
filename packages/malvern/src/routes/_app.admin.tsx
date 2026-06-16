import { DisplayCurrencyFromCents } from "@laxdb/core/schema";
import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@laxdb/ui/components/ui/alert-dialog";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import { Input } from "@laxdb/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@laxdb/ui/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Schema } from "effect";
import { useState } from "react";
import type { ReactElement } from "react";

import { authClient } from "../lib/auth-client";
import {
  addRecipient,
  createTeam,
  deleteTeam,
  listRecipients,
  listTeams,
  removeRecipient,
  updateTeam,
  type RecipientView,
  type TeamView,
} from "../lib/club";
import {
  createTemplate,
  deleteTemplate,
  issueFine,
  listMembers,
  listTemplates,
  type FineTemplateView,
  type Member,
} from "../lib/fines";
import {
  listCompetitions,
  syncFixtures,
  type CompetitionView,
} from "../lib/matches";

const formatCents = Schema.decodeSync(DisplayCurrencyFromCents);

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: ({ context }) => {
    if (
      context.me?.memberRole !== "owner" &&
      context.me?.memberRole !== "admin"
    ) {
      throw redirect({ to: "/fines" });
    }
  },
  component: Admin,
});

function ConfirmDialog({
  title,
  description,
  actionLabel,
  trigger,
  onConfirm,
}: {
  title: string;
  description?: string;
  actionLabel: string;
  trigger: ReactElement;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SectionError({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

function Admin() {
  const membersQuery = useQuery({
    queryKey: ["fine-members"],
    queryFn: () => listMembers(),
  });
  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: () => listTemplates(),
  });
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });
  const recipientsQuery = useQuery({
    queryKey: ["recipients"],
    queryFn: () => listRecipients(),
  });

  const err =
    membersQuery.error ??
    templatesQuery.error ??
    teamsQuery.error ??
    recipientsQuery.error;

  const members = membersQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const recipients = recipientsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Teams, report recipients, coaches, fines templates.
        </p>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      <Teams teams={teams} members={members} />

      <Recipients teams={teams} recipients={recipients} />

      <IssueFine members={members} templates={templates} />

      <Invite members={members} />

      <Templates templates={templates} />
    </div>
  );
}

function IssueFine({
  members,
  templates,
}: {
  members: readonly Member[];
  templates: readonly FineTemplateView[];
}) {
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const issueMutation = useMutation({
    mutationFn: (vars: {
      memberId: string;
      templateId: string | null;
      reason: string | null;
      amountCents?: number;
    }) => issueFine({ data: vars }),
    onSuccess: () => {
      setReason("");
      setAmount("");
      setTemplateId("");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fines"] }),
        queryClient.invalidateQueries({ queryKey: ["audit"] }),
      ]);
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!memberId) return;
    issueMutation.mutate({
      memberId,
      templateId: templateId || null,
      reason: reason || null,
      ...(amount ? { amountCents: Math.round(Number(amount) * 100) } : {}),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Fine</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError error={issueMutation.error} />
        <form className="flex flex-col gap-2" onSubmit={submit}>
          <div className="flex flex-wrap gap-2">
            <Select
              items={[
                { value: "", label: "— player —" },
                ...members.map((m) => ({ value: m.id, label: m.name })),
              ]}
              value={memberId}
              onValueChange={(value: string | null) => {
                setMemberId(value ?? "");
              }}
            >
              <SelectTrigger className="min-w-44 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— player —</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={[
                { value: "", label: "— template (optional) —" },
                ...templates.map((t) => ({
                  value: t.id,
                  label: `${t.label} · ${formatCents(t.amountCents)}`,
                })),
              ]}
              value={templateId}
              onValueChange={(value: string | null) => {
                const next = value ?? "";
                const selectedTemplate = templates.find(
                  (template) => template.id === next,
                );
                setTemplateId(next);
                if (selectedTemplate) {
                  setReason(selectedTemplate.label);
                  setAmount((selectedTemplate.amountCents / 100).toString());
                }
              }}
            >
              <SelectTrigger className="min-w-44 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— template (optional) —</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label} · {formatCents(t.amountCents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Reason"
              value={reason}
              onChange={(e) => {
                setReason(e.currentTarget.value);
              }}
              className="min-w-48 flex-[2]"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount $"
              value={amount}
              onChange={(e) => {
                setAmount(e.currentTarget.value);
              }}
              className="min-w-24 flex-1"
            />
            <Button type="submit" disabled={issueMutation.isPending}>
              Issue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Invite({ members }: { members: readonly Member[] }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [sent, setSent] = useState<string | null>(null);

  const inviteMutation = useMutation({
    mutationFn: (vars: { email: string; role: "member" | "admin" }) =>
      authClient.organization.inviteMember(vars),
    onMutate: () => {
      setSent(null);
    },
    onSuccess: (_result, vars) => {
      setSent(vars.email);
      setEmail("");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (vars: { memberIdOrEmail: string }) =>
      authClient.organization.removeMember(vars),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["fine-members"] }),
  });

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate({ email: email.trim(), role });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError
          error={inviteMutation.error ?? removeMemberMutation.error}
        />
        <form className="flex flex-wrap items-center gap-2" onSubmit={send}>
          <Input
            type="email"
            placeholder="player@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value);
            }}
            className="min-w-48 flex-1"
          />
          <Select
            items={[
              { value: "member", label: "player" },
              { value: "admin", label: "admin" },
            ]}
            value={role}
            onValueChange={(value: string | null) => {
              if (value === "member" || value === "admin") {
                setRole(value);
              }
            }}
          >
            <SelectTrigger className="min-w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">player</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? "Sending…" : "Invite"}
          </Button>
        </form>
        {sent && (
          <p className="text-xs text-muted-foreground">
            Invite sent to <strong className="text-foreground">{sent}</strong>.
            (Dev: check api worker logs.)
          </p>
        )}

        {members.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.email}
                  </TableCell>
                  <TableCell>{m.role}</TableCell>
                  <TableCell className="text-right">
                    {m.role !== "owner" && (
                      <ConfirmDialog
                        title={`Remove ${m.name}?`}
                        actionLabel="Remove"
                        trigger={
                          <Button
                            variant="destructive"
                            disabled={removeMemberMutation.isPending}
                          >
                            Remove
                          </Button>
                        }
                        onConfirm={() => {
                          removeMemberMutation.mutate({
                            memberIdOrEmail: m.id,
                          });
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Templates({ templates }: { templates: readonly FineTemplateView[] }) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const createMutation = useMutation({
    mutationFn: (vars: { label: string; amountCents: number }) =>
      createTemplate({ data: vars }),
    onSuccess: () => {
      setLabel("");
      setAmount("");
      return queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (vars: { id: string }) => deleteTemplate({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fine Templates</CardTitle>
        <CardDescription>Default fines for common offenses.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError error={createMutation.error ?? deleteMutation.error} />
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim() || !amount) return;
            createMutation.mutate({
              label: label.trim(),
              amountCents: Math.round(Number(amount) * 100),
            });
          }}
        >
          <Input
            placeholder='e.g. "Late to practice"'
            value={label}
            onChange={(e) => {
              setLabel(e.currentTarget.value);
            }}
            className="min-w-48 flex-[2]"
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount $"
            value={amount}
            onChange={(e) => {
              setAmount(e.currentTarget.value);
            }}
            className="min-w-24 flex-1"
          />
          <Button type="submit" disabled={createMutation.isPending}>
            Add
          </Button>
        </form>

        {templates.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.label}</TableCell>
                  <TableCell>{formatCents(t.amountCents)}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmDialog
                      title={`Delete "${t.label}"?`}
                      actionLabel="Remove"
                      trigger={
                        <Button
                          variant="destructive"
                          disabled={deleteMutation.isPending}
                        >
                          Remove
                        </Button>
                      }
                      onConfirm={() => {
                        deleteMutation.mutate({ id: t.id });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type TeamUpdate = {
  id: string;
  gamedayCompId?: string | null;
  gamedayTeamId?: string | null;
  coachMemberId?: string | null;
};

function Teams({
  teams,
  members,
}: {
  teams: readonly TeamView[];
  members: readonly Member[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [compsRequested, setCompsRequested] = useState(false);

  const compsQuery = useQuery({
    queryKey: ["competitions"],
    queryFn: () => listCompetitions({ data: {} }),
    enabled: compsRequested,
  });

  const createMutation = useMutation({
    mutationFn: (vars: { name: string }) => createTeam({ data: vars }),
    onSuccess: () => {
      setName("");
      return queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: TeamUpdate) => updateTeam({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (vars: { id: string }) => deleteTeam({ data: vars }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["fixtures"] }),
        queryClient.invalidateQueries({ queryKey: ["roster"] }),
        queryClient.invalidateQueries({ queryKey: ["recipients"] }),
      ]),
  });

  const syncMutation = useMutation({
    mutationFn: (vars: { teamId: string }) => syncFixtures({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fixtures"] }),
  });

  const syncMsg = syncMutation.data
    ? `Synced ${syncMutation.data.synced} fixtures${syncMutation.data.compName ? ` from ${syncMutation.data.compName}` : ""}.`
    : null;

  const err =
    compsQuery.error ??
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error ??
    syncMutation.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardDescription>
          Link each team to its Lacrosse Victoria competition on GameDay, assign
          a coach, then sync fixtures.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError error={err} />
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate({ name: name.trim() });
          }}
        >
          <Input
            placeholder='e.g. "Malvern Men’s State League"'
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
            }}
            className="min-w-48 flex-[2]"
          />
          <Button type="submit" disabled={createMutation.isPending}>
            Add team
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (compsRequested) {
                void compsQuery.refetch();
              } else {
                setCompsRequested(true);
              }
            }}
            disabled={compsQuery.isFetching}
          >
            {compsQuery.isFetching ? "Loading…" : "Load GameDay comps"}
          </Button>
        </form>

        {syncMsg && <p className="text-xs text-muted-foreground">{syncMsg}</p>}

        {teams.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>GameDay comp</TableHead>
                <TableHead>GameDay team id</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  members={members}
                  comps={compsQuery.data}
                  syncing={
                    syncMutation.isPending &&
                    syncMutation.variables.teamId === team.id
                  }
                  onSync={() => {
                    syncMutation.mutate({ teamId: team.id });
                  }}
                  onUpdate={(vars) => {
                    updateMutation.mutate(vars);
                  }}
                  onDelete={() => {
                    deleteMutation.mutate({ id: team.id });
                  }}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TeamRow({
  team,
  members,
  comps,
  syncing,
  onSync,
  onUpdate,
  onDelete,
}: {
  team: TeamView;
  members: readonly Member[];
  comps: readonly CompetitionView[] | undefined;
  syncing: boolean;
  onSync: () => void;
  onUpdate: (vars: TeamUpdate) => void;
  onDelete: () => void;
}) {
  const [gamedayTeamId, setGamedayTeamId] = useState(team.gamedayTeamId ?? "");

  return (
    <TableRow>
      <TableCell>{team.name}</TableCell>
      <TableCell>
        {comps === undefined ? (
          <span className="text-muted-foreground">
            {team.gamedayCompId ?? "—"}
          </span>
        ) : (
          <Select
            items={[
              { value: "", label: "— competition —" },
              ...comps.map((comp) => ({
                value: comp.compId,
                label: comp.name,
              })),
            ]}
            value={team.gamedayCompId ?? ""}
            onValueChange={(value: string | null) => {
              const compId = value === null || value === "" ? null : value;
              onUpdate({ id: team.id, gamedayCompId: compId });
            }}
          >
            <SelectTrigger className="w-full max-w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— competition —</SelectItem>
              {comps.map((comp) => (
                <SelectItem key={comp.compId} value={comp.compId}>
                  {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        <Input
          placeholder="optional"
          value={gamedayTeamId}
          onChange={(e) => {
            setGamedayTeamId(e.currentTarget.value);
          }}
          onBlur={() => {
            if ((team.gamedayTeamId ?? "") !== gamedayTeamId.trim()) {
              onUpdate({
                id: team.id,
                gamedayTeamId: gamedayTeamId.trim() || null,
              });
            }
          }}
          className="w-32"
        />
      </TableCell>
      <TableCell>
        <Select
          items={[
            { value: "", label: "— coach —" },
            ...members.map((member) => ({
              value: member.id,
              label: member.name,
            })),
          ]}
          value={team.coachMemberId ?? ""}
          onValueChange={(value: string | null) => {
            const coachMemberId = value === null || value === "" ? null : value;
            onUpdate({ id: team.id, coachMemberId });
          }}
        >
          <SelectTrigger className="w-full max-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— coach —</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            onClick={onSync}
            disabled={syncing || !team.gamedayCompId}
          >
            {syncing ? "Syncing…" : "Sync"}
          </Button>
          <ConfirmDialog
            title={`Delete ${team.name}?`}
            description="Fixtures go with it."
            actionLabel="Remove"
            trigger={<Button variant="destructive">Remove</Button>}
            onConfirm={onDelete}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function Recipients({
  teams,
  recipients,
}: {
  teams: readonly TeamView[];
  recipients: readonly RecipientView[];
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [teamId, setTeamId] = useState("");

  const addMutation = useMutation({
    mutationFn: (vars: {
      label: string;
      email: string;
      teamId: string | null;
    }) => addRecipient({ data: vars }),
    onSuccess: () => {
      setLabel("");
      setEmail("");
      setTeamId("");
      return queryClient.invalidateQueries({ queryKey: ["recipients"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (vars: { id: string }) => removeRecipient({ data: vars }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["recipients"] }),
  });

  const teamName = (id: string | null) =>
    id === null
      ? "All teams"
      : (teams.find((team) => team.id === id)?.name ?? "—");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report recipients</CardTitle>
        <CardDescription>
          Who match reports get emailed to. Org-wide recipients apply to every
          team; team recipients only to theirs. Coaches choose from these when
          submitting.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError error={addMutation.error ?? removeMutation.error} />
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim() || !email.trim()) return;
            addMutation.mutate({
              label: label.trim(),
              email: email.trim(),
              teamId: teamId || null,
            });
          }}
        >
          <Input
            placeholder='e.g. "Club secretary"'
            value={label}
            onChange={(e) => {
              setLabel(e.currentTarget.value);
            }}
            className="min-w-40 flex-1"
          />
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.currentTarget.value);
            }}
            className="min-w-40 flex-1"
          />
          <Select
            items={[
              { value: "", label: "All teams" },
              ...teams.map((team) => ({ value: team.id, label: team.name })),
            ]}
            value={teamId}
            onValueChange={(value: string | null) => {
              setTeamId(value ?? "");
            }}
          >
            <SelectTrigger className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={addMutation.isPending}>
            Add
          </Button>
        </form>

        {recipients.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.label}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {recipient.email}
                  </TableCell>
                  <TableCell>{teamName(recipient.teamId)}</TableCell>
                  <TableCell className="text-right">
                    <ConfirmDialog
                      title={`Remove ${recipient.label}?`}
                      actionLabel="Remove"
                      trigger={
                        <Button
                          variant="destructive"
                          disabled={removeMutation.isPending}
                        >
                          Remove
                        </Button>
                      }
                      onConfirm={() => {
                        removeMutation.mutate({ id: recipient.id });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
