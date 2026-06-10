import {
  DisplayCurrencyFromCents,
  DisplayDateFromDate,
} from "@laxdb/core/schema";
import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
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
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { useMemo, useState } from "react";

import {
  forgiveFine,
  listFines,
  listMembers,
  payFine,
  type FineView,
} from "../lib/fines";

const formatCents = Schema.decodeSync(DisplayCurrencyFromCents);
const formatDate = (value: Date | string | number) =>
  Schema.decodeSync(DisplayDateFromDate)(new Date(value));

export const Route = createFileRoute("/_app/fines")({
  component: Board,
});

type Row = FineView & { readonly memberName: string };

const STATUS_BADGE_CLASS: Record<FineView["status"], string> = {
  unpaid: "bg-warning/15 text-warning",
  paid: "bg-success/15 text-success",
  forgiven: "bg-muted text-muted-foreground",
};

const FILTERS = ["all", "unpaid", "paid", "forgiven"] as const;

function Board() {
  const { me } = Route.useRouteContext();
  const isAdmin = me?.memberRole === "owner" || me?.memberRole === "admin";
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("unpaid");

  const finesQuery = useQuery({
    queryKey: ["fines"],
    queryFn: () => listFines(),
  });
  const membersQuery = useQuery({
    queryKey: ["fine-members"],
    queryFn: () => listMembers(),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["fines"] }),
      queryClient.invalidateQueries({ queryKey: ["audit"] }),
    ]);

  const payMutation = useMutation({
    mutationFn: (id: string) => payFine({ data: { id } }),
    onSuccess: invalidate,
  });
  const forgiveMutation = useMutation({
    mutationFn: (id: string) => forgiveFine({ data: { id, note: null } }),
    onSuccess: invalidate,
  });

  const err =
    finesQuery.error ??
    membersQuery.error ??
    payMutation.error ??
    forgiveMutation.error;
  const acting = payMutation.isPending || forgiveMutation.isPending;

  const fines = finesQuery.data;
  const members = membersQuery.data ?? [];

  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );

  const rows: Row[] = useMemo(
    () =>
      (fines ?? [])
        .filter((f) => filter === "all" || f.status === filter)
        .map((f) =>
          Object.assign({}, f, {
            memberName: membersById.get(f.memberId)?.name ?? "Unknown",
          }),
        ),
    [fines, filter, membersById],
  );

  const totals = useMemo(() => {
    const unpaidByMember = new Map<string, number>();
    for (const f of fines ?? []) {
      if (f.status !== "unpaid") continue;
      unpaidByMember.set(
        f.memberId,
        (unpaidByMember.get(f.memberId) ?? 0) + f.amountCents,
      );
    }
    return [...unpaidByMember.entries()]
      .map(([mid, c]) => ({
        name: membersById.get(mid)?.name ?? "Unknown",
        cents: c,
      }))
      .toSorted((a, b) => b.cents - a.cents);
  }, [fines, membersById]);

  const now = Date.now();

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Fines Board</h1>
        <p className="text-sm text-muted-foreground">
          Unpaid fines double every week.
        </p>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard (unpaid)</CardTitle>
        </CardHeader>
        <CardContent>
          {totals.length === 0 ? (
            <p className="text-muted-foreground">Nobody owes. For now.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totals.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCents(t.cents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Fines</CardTitle>
          <CardAction className="flex gap-1">
            {FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "ghost"}
                onClick={() => {
                  setFilter(f);
                }}
              >
                {f}
              </Button>
            ))}
          </CardAction>
        </CardHeader>
        <CardContent>
          {finesQuery.isPending ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Spinner />
              Loading…
            </p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No fines match.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  {isAdmin && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const overdue =
                    r.status === "unpaid" && new Date(r.dueAt).getTime() < now;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.memberName}</TableCell>
                      <TableCell className="whitespace-normal">
                        {r.reason}
                        {r.amountCents !== r.originalAmountCents && (
                          <span className="ml-1.5 text-muted-foreground">
                            (from {formatCents(r.originalAmountCents)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCents(r.amountCents)}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE_CLASS[r.status]}>
                          {r.status}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive" className="ml-1">
                            overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(r.dueAt)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {r.status === "unpaid" && (
                            <div className="flex justify-end gap-1">
                              <Button
                                disabled={acting}
                                onClick={() => {
                                  payMutation.mutate(r.id);
                                }}
                              >
                                Pay
                              </Button>
                              <Button
                                variant="outline"
                                disabled={acting}
                                onClick={() => {
                                  forgiveMutation.mutate(r.id);
                                }}
                              >
                                Forgive
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
