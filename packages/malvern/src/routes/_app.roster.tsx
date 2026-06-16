import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@laxdb/ui/components/ui/alert-dialog";
import { Button } from "@laxdb/ui/components/ui/button";
import { Card, CardContent } from "@laxdb/ui/components/ui/card";
import { Input } from "@laxdb/ui/components/ui/input";
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
import { cn } from "@laxdb/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactElement } from "react";

import {
  addRosterPlayer,
  listRoster,
  listTeams,
  removeRosterPlayer,
  updateRosterPlayer,
} from "../lib/club";

export const Route = createFileRoute("/_app/roster")({
  component: Roster,
});

function ConfirmDialog({
  title,
  actionLabel,
  trigger,
  onConfirm,
}: {
  title: string;
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

function Roster() {
  const routeContext = Route.useRouteContext();
  const queryClient = useQueryClient();

  const [pickedTeamId, setPickedTeamId] = useState("");
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: () => listTeams(),
  });
  const teams = teamsQuery.data ?? [];
  const activeMemberId = routeContext.me?.activeMemberId ?? null;
  const availableTeams = routeContext.isAdmin
    ? teams
    : teams.filter((team) => team.coachMemberId === activeMemberId);
  const pickedTeamIsAvailable = availableTeams.some(
    (team) => team.id === pickedTeamId,
  );
  const teamId = pickedTeamIsAvailable
    ? pickedTeamId
    : (availableTeams.at(0)?.id ?? "");

  const rosterQuery = useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => listRoster({ data: { teamId } }),
    enabled: teamId !== "",
  });
  const roster = rosterQuery.data ?? [];

  const invalidateRoster = () =>
    queryClient.invalidateQueries({ queryKey: ["roster", teamId] });

  const addPlayer = useMutation({
    mutationFn: (vars: {
      teamId: string;
      name: string;
      jerseyNumber: number | null;
    }) => addRosterPlayer({ data: vars }),
    onSuccess: () => {
      setName("");
      setJersey("");
      return invalidateRoster();
    },
  });

  const togglePlayer = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) =>
      updateRosterPlayer({ data: vars }),
    onSuccess: invalidateRoster,
  });

  const removePlayer = useMutation({
    mutationFn: (vars: { id: string }) => removeRosterPlayer({ data: vars }),
    onSuccess: invalidateRoster,
  });

  const err =
    teamsQuery.error ??
    rosterQuery.error ??
    addPlayer.error ??
    togglePlayer.error ??
    removePlayer.error;

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || teamId === "") return;
    addPlayer.mutate({
      teamId,
      name: name.trim(),
      jerseyNumber: jersey === "" ? null : Number(jersey),
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Roster</h1>
          <p className="text-sm text-muted-foreground">
            Players available when submitting match reports.
          </p>
        </div>
        {availableTeams.length > 1 && (
          <Select
            items={availableTeams.map((team) => ({
              value: team.id,
              label: team.name,
            }))}
            value={teamId}
            onValueChange={(value: string | null) => {
              if (value !== null) setPickedTeamId(value);
            }}
          >
            <SelectTrigger className="min-w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      {teamsQuery.isSuccess && availableTeams.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">
              {teams.length === 0
                ? "No teams set up yet. An admin needs to create your team under Admin."
                : "You are not assigned as coach of any teams yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <form className="flex flex-wrap items-center gap-2" onSubmit={add}>
              <Input
                placeholder="Player name"
                value={name}
                onChange={(e) => {
                  setName(e.currentTarget.value);
                }}
                className="min-w-48 flex-[2]"
              />
              <Input
                type="number"
                min="0"
                placeholder="#"
                value={jersey}
                onChange={(e) => {
                  setJersey(e.currentTarget.value);
                }}
                className="min-w-16 flex-1"
              />
              <Button type="submit" disabled={addPlayer.isPending}>
                Add player
              </Button>
            </form>

            {rosterQuery.isPending ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Spinner />
                Loading…
              </p>
            ) : roster.length === 0 ? (
              <p className="text-muted-foreground">No players yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="text-muted-foreground">
                        {player.jerseyNumber ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          !player.active && "text-muted-foreground",
                        )}
                      >
                        {player.name}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          disabled={togglePlayer.isPending}
                          onClick={() => {
                            togglePlayer.mutate({
                              id: player.id,
                              active: !player.active,
                            });
                          }}
                        >
                          {player.active ? "active" : "inactive"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDialog
                          title={`Remove ${player.name}?`}
                          actionLabel="Remove"
                          trigger={
                            <Button
                              variant="destructive"
                              disabled={removePlayer.isPending}
                            >
                              Remove
                            </Button>
                          }
                          onConfirm={() => {
                            removePlayer.mutate({ id: player.id });
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
      )}
    </div>
  );
}
