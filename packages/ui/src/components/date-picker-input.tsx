"use client";

import { Button } from "@laxdb/ui/components/ui/button";
import { Calendar } from "@laxdb/ui/components/ui/calendar";
import { Input } from "@laxdb/ui/components/ui/input";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@laxdb/ui/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !Number.isNaN(date.getTime());
}

export default function Calendar28() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    new Date("2025-06-01"),
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  return (
    <div className="flex flex-col gap-3">
      <Label className="px-1" htmlFor="date">
        Subscription Date
      </Label>
      <div className="relative flex gap-2">
        <Input
          className="bg-background pr-10"
          id="date"
          onChange={(e) => {
            const date = new Date(e.target.value);
            setValue(e.target.value);
            if (isValidDate(date)) {
              setDate(date);
              setMonth(date);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          placeholder="June 01, 2025"
          value={value}
        />
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger
            render={
              <Button
                className="absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2"
                id="date-picker"
                size="icon"
                variant="ghost"
              />
            }
          >
            <CalendarIcon className="size-3" />
            <span className="sr-only">Select date</span>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            alignOffset={-8}
            className="w-auto overflow-hidden p-0"
            sideOffset={10}
          >
            <Calendar
              captionLayout="dropdown"
              mode="single"
              {...(month !== undefined && { month })}
              onMonthChange={setMonth}
              onSelect={(date) => {
                setDate(date);
                setValue(formatDate(date));
                setOpen(false);
              }}
              {...(date !== undefined && { selected: date })}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
