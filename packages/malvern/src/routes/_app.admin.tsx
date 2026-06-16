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
import { Checkbox } from "@laxdb/ui/components/ui/checkbox";
import { Input } from "@laxdb/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@laxdb/ui/components/ui/popover";
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
import { listMembers, type Member } from "../lib/fines";
import {
  listCompetitionsForClubs,
  listGamedayClubs,
  listGamedaySeasons,
  syncFixtures,
  type GamedayTeamCompetitionView,
} from "../lib/matches";

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

      <Teams
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
  gamedayCompId?: string | null;
  gamedayTeamId?: string | null;
  coachMemberId?: string | null;
};

function Teams({
  teams,
  members,
  loading,
}: {
  teams: readonly TeamView[];
  members: readonly Member[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [selectedClubNames, setSelectedClubNames] = useState<readonly string[]>(
    [],
  );
  const [clubSearch, setClubSearch] = useState("");
  const [clubPickerOpen, setClubPickerOpen] = useState(false);

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
  const visibleGamedayClubs = useMemo(() => {
    const search = clubSearch.trim().toLocaleLowerCase();
    if (search === "") return gamedayClubs;
    return gamedayClubs.filter((club) =>
      club.name.toLocaleLowerCase().includes(search),
    );
  }, [clubSearch, gamedayClubs]);

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
                gamedayCompId:
                  vars.gamedayCompId === undefined
                    ? team.gamedayCompId
                    : vars.gamedayCompId,
                gamedayTeamId:
                  vars.gamedayTeamId === undefined
                    ? team.gamedayTeamId
                    : vars.gamedayTeamId,
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

  const importMutation = useMutation({
    mutationFn: async (vars: {
      competitions: readonly GamedayTeamCompetitionView[];
    }) => {
      await Promise.all(
        vars.competitions.map((competition) => {
          const existing = teams.find(
            (team) =>
              team.gamedayCompId === competition.compId &&
              team.gamedayTeamId === competition.teamId,
          );
          const name =
            competition.teamName === "Malvern Lacrosse Club"
              ? competition.compName
              : `${competition.compName} — ${competition.teamName}`;
          const data = {
            name,
            gamedayCompId: competition.compId,
            gamedayTeamId: competition.teamId,
          };
          if (existing) {
            return updateTeam({ data: { id: existing.id, ...data } });
          }
          return createTeam({ data });
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const syncMutation = useMutation({
    mutationFn: (vars: { teamId: string }) => syncFixtures({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fixtures"] }),
  });

  const competitions = competitionsQuery.data ?? [];
  const importableCompetitions = competitions.filter(
    (competition) =>
      !teams.some(
        (team) =>
          team.gamedayCompId === competition.compId &&
          team.gamedayTeamId === competition.teamId,
      ),
  );
  const syncMsg = syncMutation.data
    ? `Synced ${syncMutation.data.synced} fixtures${syncMutation.data.compName ? ` from ${syncMutation.data.compName}` : ""}.`
    : null;
  const importMsg = importMutation.isSuccess
    ? "Squads imported from GameDay."
    : null;
  const err =
    seasonsQuery.error ??
    clubsQuery.error ??
    competitionsQuery.error ??
    updateMutation.error ??
    deleteMutation.error ??
    importMutation.error ??
    syncMutation.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardDescription>
          Select the GameDay season and every club/combined-team name Malvern
          participates in, import those competitions as squads, then assign
          coaches and sync fixtures.
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
                <Popover open={clubPickerOpen} onOpenChange={setClubPickerOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                        disabled={clubsQuery.isFetching && !clubsQuery.data}
                      />
                    }
                  >
                    <span className="truncate">
                      {selectedClubNames.length === 0
                        ? "Search/select GameDay names"
                        : `${selectedClubNames.length} GameDay name${
                            selectedClubNames.length === 1 ? "" : "s"
                          } selected`}
                    </span>
                    <span className="text-muted-foreground">⌄</span>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[min(36rem,calc(100vw-2rem))] gap-2 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={clubSearch}
                        onChange={(event) => {
                          setClubSearch(event.currentTarget.value);
                        }}
                        placeholder="Search GameDay names, e.g. Malvern or Brunswick"
                      />
                      {gamedayClubs.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => {
                            const search = clubSearch.trim();
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
                    </div>
                    <div className="max-h-64 overflow-auto rounded-md border bg-background p-2">
                      {clubsQuery.isFetching && !clubsQuery.data ? (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Spinner />
                          Loading GameDay clubs…
                        </p>
                      ) : gamedayClubs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Select a season to load GameDay club names.
                        </p>
                      ) : visibleGamedayClubs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No GameDay names match “{clubSearch.trim()}”.
                        </p>
                      ) : (
                        <div className="grid gap-1 md:grid-cols-2">
                          {visibleGamedayClubs.map((club) => {
                            const checked = selectedClubNames.includes(
                              club.name,
                            );
                            return (
                              <label
                                key={club.name}
                                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => {
                                    setSelectedClubNames((current) =>
                                      current.includes(club.name)
                                        ? current.filter(
                                            (name) => name !== club.name,
                                          )
                                        : [...current, club.name],
                                    );
                                  }}
                                />
                                <span>{club.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {selectedClubNames.length === 0
                          ? "No GameDay names selected."
                          : `${selectedClubNames.length} selected.`}
                      </span>
                      <div className="flex gap-1">
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
                          onClick={() => {
                            setClubPickerOpen(false);
                          }}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                type="button"
                onClick={() => {
                  importMutation.mutate({ competitions });
                }}
                disabled={
                  competitionsQuery.isFetching ||
                  importMutation.isPending ||
                  competitions.length === 0
                }
              >
                {importMutation.isPending
                  ? "Importing…"
                  : importableCompetitions.length === 0 &&
                      competitions.length > 0
                    ? "Refresh squads"
                    : `Import ${importableCompetitions.length} squads`}
              </Button>
            </div>

            {seasonsQuery.isFetching && seasons.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Loading GameDay seasons…
              </p>
            )}
            {clubsQuery.isFetching &&
              selectedSeasonId !== "" &&
              !clubsQuery.data && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  Loading GameDay clubs…
                </p>
              )}
            {competitionsQuery.isFetching && selectedClubNames.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner />
                Loading squads for {selectedClubNames.length} selected GameDay
                name{selectedClubNames.length === 1 ? "" : "s"}…
              </p>
            )}
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

function TeamRow({
  team,
  members,
  syncing,
  onSync,
  onUpdate,
  onDelete,
}: {
  team: TeamView;
  members: readonly Member[];
  syncing: boolean;
  onSync: () => void;
  onUpdate: (vars: TeamUpdate) => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell>{team.name}</TableCell>
      <TableCell>
        <Select
          items={[
            { value: "", label: "— coach —" },
            ...members.map((member) => ({
              value: member.id,
              label: memberLabel(member),
            })),
          ]}
          value={team.coachMemberId ?? ""}
          onValueChange={(value: string | null) => {
            const coachMemberId = value === null || value === "" ? null : value;
            onUpdate({ id: team.id, coachMemberId });
          }}
        >
          <SelectTrigger className="w-full max-w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— coach —</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {memberLabel(member)}
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
            disabled={syncing || !team.gamedayCompId || !team.gamedayTeamId}
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
