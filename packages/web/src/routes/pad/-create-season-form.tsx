import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { RuntimeServer } from '@laxdb/core/runtime.server';
import { CreateSeasonInput } from '@laxdb/core/season/season.schema';
import { SeasonService } from '@laxdb/core/season/season.service';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/page-content';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authMiddleware } from '@/lib/middleware';

const createSeason = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: typeof CreateSeasonInput.Type) =>
    Schema.decodeSync(CreateSeasonInput)(data)
  )
  .handler(async ({ data }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const seasonService = yield* SeasonService;
        return yield* seasonService.create(data);
      })
    )
  );

type FormData = typeof CreateSeasonInput.Type;

export function CreateSeasonForm({
  organizationId,
  teamId,
}: {
  organizationId: string;
  teamId: string;
}) {
  const router = useRouter();

  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: effectTsResolver(CreateSeasonInput),
    defaultValues: {
      organizationId,
      teamId,
      status: 'active',
      endDate: null,
      division: null,
    },
  });

  const createSeasonMutation = useMutation({
    mutationFn: (data: FormData) => createSeason({ data }),
    onSuccess: async (_result, _variables) => {
      await router.invalidate();
    },
    onError: (_error, _variables) => {
      toast.error('Failed to create season. Please try again.');
    },
  });

  const onSubmit = (data: FormData) => {
    createSeasonMutation.mutate(data);
  };

  return (
    <PageContainer className="space-y-4">
      <div>
        <h1 className="font-bold text-xl">Create a Season</h1>
        <p className="text-muted-foreground">
          Add a season to manage games, rosters, and track your team's progress
          throughout the year.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Season Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Spring 2025, Fall 2024"
                        {...field}
                        onChange={(e) => field.onChange(e)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <div className="relative flex gap-2">
                      <FormControl>
                        <Input
                          className="bg-background pr-10"
                          placeholder="Select start date"
                          readOnly
                          value={
                            field.value instanceof Date
                              ? field.value.toLocaleDateString('en-US', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : ''
                          }
                        />
                      </FormControl>
                      <Popover
                        onOpenChange={setStartDateOpen}
                        open={startDateOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            className="-translate-y-1/2 absolute top-1/2 right-2 h-6 w-6"
                            size="icon"
                            variant="ghost"
                          >
                            <CalendarIcon className="size-3" />
                            <span className="sr-only">Select date</span>
                          </Button>
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
                            onSelect={(date) => {
                              field.onChange(date);
                              setStartDateOpen(false);
                            }}
                            selected={
                              field.value instanceof Date
                                ? field.value
                                : undefined
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <div className="relative flex gap-2">
                      <FormControl>
                        <Input
                          className="bg-background pr-10"
                          placeholder="Select end date"
                          readOnly
                          value={
                            field.value instanceof Date
                              ? field.value.toLocaleDateString('en-US', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })
                              : ''
                          }
                        />
                      </FormControl>
                      <Popover onOpenChange={setEndDateOpen} open={endDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            className="-translate-y-1/2 absolute top-1/2 right-2 h-6 w-6"
                            size="icon"
                            variant="ghost"
                          >
                            <CalendarIcon className="size-3" />
                            <span className="sr-only">Select date</span>
                          </Button>
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
                            onSelect={(date) => {
                              field.onChange(date || null);
                              setEndDateOpen(false);
                            }}
                            selected={
                              field.value instanceof Date
                                ? field.value
                                : undefined
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} {...(field.value !== undefined && { value: field.value })}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="division"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., U15, Division 1, Premier"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button disabled={createSeasonMutation.isPending} type="submit">
                  {createSeasonMutation.isPending
                    ? 'Creating...'
                    : 'Create Season'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
