import { DisplayCurrencyFromCents } from "@laxdb/core/schema";
import { Alert, AlertDescription } from "@laxdb/ui/components/ui/alert";
import { Badge } from "@laxdb/ui/components/ui/badge";
import { Button } from "@laxdb/ui/components/ui/button";
import { Card, CardContent, CardHeader } from "@laxdb/ui/components/ui/card";
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";
import { useMemo, useState } from "react";

import { listAudit, listMembers, type AuditEntry } from "../../lib/fines";

const formatCents = Schema.decodeSync(DisplayCurrencyFromCents);

export const Route = createFileRoute("/_app/audit")({
  component: Audit,
});

const KIND_ORDER = [
  "all",
  "issued",
  "paid",
  "doubled",
  "forgiven",
  "adjusted",
] as const;

const kindBadgeClass = (kind: AuditEntry["event"]["kind"]) =>
  kind === "paid"
    ? "bg-success/15 text-success"
    : kind === "issued"
      ? "bg-warning/15 text-warning"
      : kind === "doubled"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted text-muted-foreground";

function Audit() {
  const [kind, setKind] = useState<(typeof KIND_ORDER)[number]>("all");

  const auditQuery = useQuery({
    queryKey: ["audit"],
    queryFn: () => listAudit({ data: { limit: 200 } }),
  });
  const membersQuery = useQuery({
    queryKey: ["fine-members"],
    queryFn: () => listMembers(),
  });

  const err = auditQuery.error ?? membersQuery.error;
  const entries = auditQuery.data;
  const members = membersQuery.data ?? [];

  const membersById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  const membersByUserId = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members],
  );

  const filtered = useMemo(
    () =>
      (entries ?? []).filter((e) => kind === "all" || e.event.kind === kind),
    [entries, kind],
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit</h1>
        <p className="text-sm text-muted-foreground">
          Every fine event in one place.
        </p>
      </header>

      {err && (
        <Alert variant="destructive">
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-1">
            {KIND_ORDER.map((k) => (
              <Button
                key={k}
                variant={kind === k ? "default" : "ghost"}
                onClick={() => {
                  setKind(k);
                }}
              >
                {k}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {auditQuery.isPending ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Spinner />
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground">No events.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Δ</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ event, fine }) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {membersById.get(fine.memberId)?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={kindBadgeClass(event.kind)}>
                        {event.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {fine.reason}
                    </TableCell>
                    <TableCell>{formatCents(event.amountCents)}</TableCell>
                    <TableCell
                      className={cn(
                        event.deltaCents > 0 && "text-warning",
                        event.deltaCents < 0 && "text-success",
                      )}
                    >
                      {event.deltaCents > 0 ? "+" : ""}
                      {formatCents(event.deltaCents)}
                    </TableCell>
                    <TableCell>
                      {event.actorUserId
                        ? (membersByUserId.get(event.actorUserId)?.name ?? "—")
                        : "system"}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {event.note ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
