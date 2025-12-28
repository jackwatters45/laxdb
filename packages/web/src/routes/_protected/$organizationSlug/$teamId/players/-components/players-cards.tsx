import type { TeamPlayerWithInfo } from "@laxdb/core/player/player.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";

export function PlayerCards({ players }: { players: TeamPlayerWithInfo[] }) {
  return (
    <div className="xl:gris-cols-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...players, ...players, ...players, ...players, ...players].map(
        (player, i) => (
          <PlayerCard key={`${player.publicId}-${i}`} player={player} />
        ),
      )}
    </div>
  );
}

function PlayerCard({ player }: { player: TeamPlayerWithInfo }) {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle>{player.name}</CardTitle>
        <CardDescription>{player.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">1</div>
            <div className="grid gap-2">
              <div className="flex items-center">2</div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">Footer</CardFooter>
    </Card>
  );
}
