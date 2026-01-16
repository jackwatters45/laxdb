import {
  FilterActions,
  FilterBar,
  FilterBarDisplayTypeToggle,
  FilterBarProvider,
  FilterBarViewOptions,
  FilterCheckbox,
  FilterClear,
  FilterGroup,
  FilterSearch,
} from "@laxdb/ui/components/data-table/data-table-filterbar";
import { useDataTable } from "@laxdb/ui/components/data-table/use-data-table";
import { Button } from "@laxdb/ui/components/ui/button";
import { Plus } from "lucide-react";

import { POSITION_SELECT_FIELDS } from "@/lib/constants";

import { AddPlayerCommand } from "./add-player-command";

export function PlayersFilterBar({ organizationId }: { organizationId: string }) {
  const { table } = useDataTable();

  return (
    <FilterBarProvider table={table}>
      <FilterBar>
        <FilterGroup>
          {table.getColumn("name")?.getIsVisible() && (
            <FilterSearch column="name" placeholder="Search by name..." />
          )}
          {table.getColumn("position")?.getIsVisible() && (
            <FilterCheckbox
              column={table.getColumn("position")}
              options={POSITION_SELECT_FIELDS}
              title="Position"
            />
          )}
          <FilterClear />
        </FilterGroup>
        <FilterActions>
          <FilterBarDisplayTypeToggle />
          <FilterBarViewOptions />
          <AddPlayerCommand organizationId={organizationId}>
            <Button size="sm">
              <Plus className="size-4" />
              <span className="hidden lg:block">Add Player</span>
            </Button>
          </AddPlayerCommand>
        </FilterActions>
      </FilterBar>
    </FilterBarProvider>
  );
}
