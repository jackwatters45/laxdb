import { ClubTeam } from "@laxdb/core/club/club.schema";
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
import { MultiSearchCombobox } from "@laxdb/ui/components/ui/search-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Spinner } from "@laxdb/ui/components/ui/spinner";
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
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { authClient } from "../../lib/auth-client";
import {
  addRecipient,
  deleteTeam,
  listRecipients,
  listTeams,
  removeRecipient,
  updateTeam,
  type RecipientView,
  type TeamView,
} from "../../lib/club";
import { listMembers, type Member } from "../../lib/fines";
import {
  importGamedayTeams,
  listCompetitionsForClubs,
  listGamedayClubs,
  listGamedaySeasons,
  syncGamedayAssociationSeason,
  type GamedayTeamCompetitionView,
} from "../../lib/matches";

export const Route = createFileRoute("/_app/admin")({
  beforeLoad: ({ context }) => {
    if (
      context.me?.memberRole !== "owner" &&
      context.me?.memberRole !== "admin"
    ) {
      throw redirect({ to: "/fixtures" });
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
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });
  const recipientsQuery = useQuery({
    queryKey: ["recipients"],
    queryFn: () => listRecipients(),
  });

  const err = membersQuery.error ?? teamsQuery.error ?? recipientsQuery.error;

  const routeContext = Route.useRouteContext();
  const fetchedMembers = membersQuery.data ?? [];
  const members = useMemo(() => {
    const me = routeContext.me;
    if (
      !me?.activeMemberId ||
      !me.memberRole ||
      fetchedMembers.some((member) => member.id === me.activeMemberId)
    ) {
      return fetchedMembers;
    }
    return [
      {
        id: me.activeMemberId,
        userId: me.userId,
        role: me.memberRole,
        name: me.userName,
        email: me.userEmail,
      },
      ...fetchedMembers,
    ];
  }, [fetchedMembers, routeContext.me]);
  const teams = teamsQuery.data ?? [];
  const recipients = recipientsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Teams, report recipients, coaches, and player access.
        </p>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      <Teams teams={teams} loading={teamsQuery.isPending} />

      <Coaches
        teams={teams}
        members={members}
        loading={teamsQuery.isPending || membersQuery.isPending}
      />

      <Recipients teams={teams} recipients={recipients} />

      <Invite members={members} teams={teams} />
    </div>
  );
}

function Invite({
  members,
  teams,
}: {
  members: readonly Member[];
  teams: readonly TeamView[];
}) {
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
        <CardTitle>People</CardTitle>
        <CardDescription>
          Invite admins or players. A player becomes a coach when they are
          assigned to a team above.
        </CardDescription>
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
                  <TableCell>{memberLabel(m)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.email}
                  </TableCell>
                  <TableCell>{memberRoleLabel(m, teams)}</TableCell>
                  <TableCell className="text-right">
                    {m.role !== "owner" && (
                      <ConfirmDialog
                        title={`Remove ${memberLabel(m)}?`}
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

type TeamUpdate = {
  id: string;
  name?: string;
  coachMemberId?: string | null;
};

function Coaches({
  teams,
  members,
  loading,
}: {
  teams: readonly TeamView[];
  members: readonly Member[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (vars: TeamUpdate) => updateTeam({ data: vars }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["teams"] });
      const previous = queryClient.getQueryData<readonly TeamView[]>(["teams"]);
      queryClient.setQueryData<readonly TeamView[]>(["teams"], (current) =>
        current?.map((team) =>
          team.id === vars.id
            ? new ClubTeam({
                id: team.id,
                organizationId: team.organizationId,
                name: vars.name ?? team.name,
                coachMemberId:
                  vars.coachMemberId === undefined
                    ? team.coachMemberId
                    : vars.coachMemberId,
                createdAt: team.createdAt,
              })
            : team,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(["teams"], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coaches</CardTitle>
        <CardDescription>
          Assign one coach to each squad. Invite them under People first if they
          are not listed here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError error={updateMutation.error} />
        {loading ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner /> Loading coaches…
          </p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Import a squad before assigning its coach.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Squad</TableHead>
                <TableHead>Assigned coach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>
                    <Select
                      items={[
                        { value: "", label: "Unassigned" },
                        ...members.map((member) => ({
                          value: member.id,
                          label: memberLabel(member),
                        })),
                      ]}
                      value={team.coachMemberId ?? ""}
                      onValueChange={(value: string | null) => {
                        updateMutation.mutate({
                          id: team.id,
                          coachMemberId:
                            value === null || value === "" ? null : value,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full max-w-72">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {memberLabel(member)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

function Teams({
  teams,
  loading,
}: {
  teams: readonly TeamView[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedClubNames, setSelectedClubNames] = useState<readonly string[]>(
    [],
  );

  const seasonsQuery = useQuery({
    queryKey: ["gameday-seasons"],
    queryFn: () => listGamedaySeasons(),
    staleTime: 1000 * 60 * 30,
  });
  const seasons = seasonsQuery.data ?? [];

  useEffect(() => {
    if (selectedSeasonId !== "" || seasons.length === 0) return;
    setSelectedSeasonId(seasons[0]?.seasonId ?? "");
  }, [seasons, selectedSeasonId]);

  const clubsQuery = useQuery({
    queryKey: ["gameday-clubs", selectedSeasonId],
    queryFn: () => listGamedayClubs({ data: { seasonId: selectedSeasonId } }),
    enabled: selectedSeasonId !== "",
    staleTime: 1000 * 60 * 30,
  });
  const gamedayClubs = useMemo(() => {
    const seen = new Set<string>();
    return (clubsQuery.data ?? []).filter((club) => {
      const name = club.name.trim();
      if (name === "" || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [clubsQuery.data]);
  const competitionsQuery = useQuery({
    queryKey: [
      "gameday-competitions-for-clubs",
      selectedSeasonId,
      selectedClubNames,
    ],
    queryFn: () =>
      listCompetitionsForClubs({
        data: {
          clubNames: [...selectedClubNames],
          seasonId: selectedSeasonId,
        },
      }),
    enabled: selectedSeasonId !== "" && selectedClubNames.length > 0,
    staleTime: 1000 * 60 * 10,
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

  const associationSyncMutation = useMutation({
    mutationFn: (vars: { seasonId?: string; includeRosters?: boolean }) =>
      syncGamedayAssociationSeason({ data: vars }),
  });

  const importMutation = useMutation({
    mutationFn: (vars: {
      seasonId: string;
      competitions: readonly GamedayTeamCompetitionView[];
    }) =>
      importGamedayTeams({
        data: {
          seasonId: vars.seasonId,
          teams: vars.competitions.map((competition) => ({
            compId: competition.compId,
            compName: competition.compName,
            teamId: competition.teamId,
            teamName: competition.teamName,
          })),
        },
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["fixtures"] }),
        queryClient.invalidateQueries({ queryKey: ["roster"] }),
      ]),
  });

  const competitions = competitionsQuery.data ?? [];
  const syncMsg = associationSyncMutation.data
    ? `Synced ${associationSyncMutation.data.sourceName} ${associationSyncMutation.data.seasonName}: ${associationSyncMutation.data.competitions} comps, ${associationSyncMutation.data.teams} teams, ${associationSyncMutation.data.fixtures} fixtures.`
    : null;
  const importMsg = importMutation.data
    ? `Linked ${importMutation.data.teams} squads, projected ${importMutation.data.fixtures} fixtures, and added ${importMutation.data.rosterPlayers} roster players.`
    : null;
  const err =
    seasonsQuery.error ??
    clubsQuery.error ??
    competitionsQuery.error ??
    deleteMutation.error ??
    associationSyncMutation.error ??
    importMutation.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardDescription>
          Sync Lacrosse Victoria for the season, then link/import the GameDay
          squads Malvern appears under and assign local coaches.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <SectionError error={err} />

        {loading ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            Loading teams…
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-[10rem_minmax(16rem,1fr)_auto] md:items-end">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Season</span>
                <Select
                  items={seasons.map((season) => ({
                    value: season.seasonId,
                    label: season.name,
                  }))}
                  value={selectedSeasonId}
                  onValueChange={(value: string | null) => {
                    setSelectedSeasonId(value ?? "");
                    setSelectedClubNames([]);
                  }}
                  disabled={seasonsQuery.isFetching && seasons.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons.map((season) => (
                      <SelectItem key={season.seasonId} value={season.seasonId}>
                        {season.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  GameDay clubs/combined teams
                </span>
                <MultiSearchCombobox
                  items={gamedayClubs}
                  selectedValues={selectedClubNames}
                  onSelectedValuesChange={setSelectedClubNames}
                  getItemValue={(club) => club.name}
                  getItemLabel={(club) => club.name}
                  label="GameDay clubs/combined teams"
                  description="Select every GameDay name that Malvern appears under this season."
                  placeholder="Search/select GameDay names"
                  searchPlaceholder="Search GameDay names, e.g. Malvern or Brunswick"
                  loading={clubsQuery.isFetching && !clubsQuery.data}
                  loadingMessage={
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Loading GameDay clubs…
                    </span>
                  }
                  emptyMessage="Select a season to load GameDay club names."
                  noResultsMessage={(query) =>
                    `No GameDay names match “${query}”.`
                  }
                  disabled={clubsQuery.isFetching && !clubsQuery.data}
                  selectedSummary={(values) =>
                    values.length === 0
                      ? "Search/select GameDay names"
                      : `${values.length} GameDay name${
                          values.length === 1 ? "" : "s"
                        } selected`
                  }
                  footerSummary={(values) =>
                    values.length === 0
                      ? "No GameDay names selected."
                      : `${values.length} selected.`
                  }
                  renderFooterActions={({ searchQuery, close }) => (
                    <>
                      {gamedayClubs.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const search = searchQuery.trim();
                            const matcher = search === "" ? "malvern" : search;
                            setSelectedClubNames(
                              gamedayClubs
                                .filter((club) =>
                                  club.name
                                    .toLocaleLowerCase()
                                    .includes(matcher.toLocaleLowerCase()),
                                )
                                .map((club) => club.name),
                            );
                          }}
                        >
                          Select matches
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedClubNames([]);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={close}
                      >
                        Done
                      </Button>
                    </>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    associationSyncMutation.mutate({
                      ...(selectedSeasonId !== "" && {
                        seasonId: selectedSeasonId,
                      }),
                      includeRosters: false,
                    });
                  }}
                  disabled={
                    selectedSeasonId === "" ||
                    associationSyncMutation.isPending ||
                    importMutation.isPending
                  }
                >
                  {associationSyncMutation.isPending
                    ? "Syncing league…"
                    : "Sync Lacrosse Victoria"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    importMutation.mutate({
                      seasonId: selectedSeasonId,
                      competitions,
                    });
                  }}
                  disabled={
                    competitionsQuery.isFetching ||
                    importMutation.isPending ||
                    associationSyncMutation.isPending ||
                    selectedSeasonId === "" ||
                    competitions.length === 0
                  }
                >
                  {importMutation.isPending
                    ? "Importing…"
                    : competitionsQuery.isFetching
                      ? "Loading squads…"
                      : competitions.length > 0
                        ? `Link/import ${competitions.length} squads`
                        : "Link/import squads"}
                </Button>
              </div>
            </div>

            {syncMsg && (
              <p className="text-xs text-muted-foreground">{syncMsg}</p>
            )}
            {importMsg && (
              <p className="text-xs text-muted-foreground">{importMsg}</p>
            )}

            {teams.length === 0 ? (
              <p className="text-muted-foreground">
                Select a season and one or more GameDay names, then import
                squads to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squad</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TeamRow
                      key={team.id}
                      team={team}
                      onDelete={() => {
                        deleteMutation.mutate({ id: team.id });
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const memberLabel = (member: Member) =>
  member.name.trim() === "" ? member.email : member.name;

const memberRoleLabel = (member: Member, teams: readonly TeamView[]) => {
  if (member.role === "owner" || member.role === "admin") return member.role;
  return teams.some((team) => team.coachMemberId === member.id)
    ? "coach"
    : "player";
};

function TeamRow({ team, onDelete }: { team: TeamView; onDelete: () => void }) {
  return (
    <TableRow>
      <TableCell>{team.name}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
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

  const teamOptions = useMemo(
    () => [
      { value: "", label: "All teams" },
      ...teams.map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams],
  );

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
            items={teamOptions}
            value={teamId}
            onValueChange={(value: string | null) => {
              setTeamId(value ?? "");
            }}
          >
            <SelectTrigger className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="end"
              className="w-max min-w-(--anchor-width) max-w-[min(44rem,calc(100vw-2rem))]"
            >
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
