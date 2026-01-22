import { Checkbox } from "@laxdb/ui/components/ui/checkbox";
import { Label } from "@laxdb/ui/components/ui/label";

const ALL_LEAGUES = ["PLL", "NLL", "MLL", "MSL", "WLA"] as const;

interface LeagueFilterProps {
  selectedLeagues: string[];
  onChange: (leagues: string[]) => void;
}

export function LeagueFilter({ selectedLeagues, onChange }: LeagueFilterProps) {
  const handleToggle = (league: string) => {
    const newLeagues = selectedLeagues.includes(league)
      ? selectedLeagues.filter((l) => l !== league)
      : [...selectedLeagues, league];

    // Require at least one league
    if (newLeagues.length === 0) {
      return;
    }

    onChange(newLeagues);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-muted-foreground">Leagues:</span>
      {ALL_LEAGUES.map((league) => (
        <div key={league} className="flex items-center gap-2">
          <Checkbox
            id={`league-${league}`}
            checked={selectedLeagues.includes(league)}
            onCheckedChange={() => handleToggle(league)}
            disabled={selectedLeagues.length === 1 && selectedLeagues.includes(league)}
          />
          <Label
            htmlFor={`league-${league}`}
            className="cursor-pointer text-sm font-medium"
          >
            {league}
          </Label>
        </div>
      ))}
    </div>
  );
}
