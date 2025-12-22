import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { RATING_ENUM, TOPIC_ENUM } from '@laxdb/core/feedback/feedback.schema';
import { FeedbackService } from '@laxdb/core/feedback/feedback.service';
import { RuntimeServer } from '@laxdb/core/runtime.server';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageBody } from '@/components/layout/page-content';
import { DashboardHeader } from '@/components/sidebar/dashboard-header';
import { BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { authMiddleware } from '@/lib/middleware';

const FeedbackSchema = Schema.Struct({
  topic: Schema.Literal(...TOPIC_ENUM),
  rating: Schema.Literal(...RATING_ENUM),
  feedback: Schema.String.pipe(
    Schema.minLength(10, {
      message: () => 'Feedback must be at least 10 characters long',
    })
  ),
});

type FeedbackFormValues = typeof FeedbackSchema.Type;

// Server function for submitting feedback
const submitFeedback = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: FeedbackFormValues) =>
    Schema.decodeSync(FeedbackSchema)(data)
  )
  .handler(async ({ data, context: { session } }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const feedbackService = yield* FeedbackService;

        const feedbackData = {
          ...data,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        };

        return yield* feedbackService.create(feedbackData);
      })
    )
  );

export const Route = createFileRoute('/_protected/$organizationSlug/feedback')({
  component: FeedbackPage,
});

function FeedbackPage() {
  const router = useRouter();

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackFormValues) => submitFeedback({ data }),
    onSuccess: () => {
      toast.success('Thank you for your feedback! We appreciate your input.');
      // TODO: eventually just go back to previous page
      router.navigate({ href: '/teams' });
    },
    onError: (_error) => {
      toast.error(
        'There was an error submitting your feedback. Please try again.'
      );
    },
  });

  const form = useForm<FeedbackFormValues>({
    resolver: effectTsResolver(FeedbackSchema),
    defaultValues: {
      feedback: '',
    },
  });

  const onSubmit = (data: FeedbackFormValues) => {
    submitFeedbackMutation.mutate(data);
  };

  return (
    <>
      <Header />
      <PageBody>
        <div className="container mx-auto max-w-2xl py-8">
          <Card>
            <CardHeader>
              <CardTitle>Send Feedback</CardTitle>
              <p className="text-muted-foreground">
                Help us improve by sharing your thoughts and suggestions.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="feature-request">
                              Feature Request
                            </SelectItem>
                            <SelectItem value="bug-report">
                              Bug Report
                            </SelectItem>
                            <SelectItem value="user-interface">
                              User Interface
                            </SelectItem>
                            <SelectItem value="performance">
                              Performance
                            </SelectItem>
                            <SelectItem value="documentation">
                              Documentation
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <RadioGroup
                            className="flex flex-col"
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormItem className="flex items-center gap-3">
                              <FormControl>
                                <RadioGroupItem value="positive" />
                              </FormControl>
                              <FormLabel className="font-normal text-green-600">
                                Positive - I'm happy with this
                                feature/experience
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center gap-3">
                              <FormControl>
                                <RadioGroupItem value="neutral" />
                              </FormControl>
                              <FormLabel className="font-normal text-yellow-600">
                                Neutral - It's okay, but could be improved
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center gap-3">
                              <FormControl>
                                <RadioGroupItem value="negative" />
                              </FormControl>
                              <FormLabel className="font-normal text-red-600">
                                Negative - I'm frustrated or encountering issues
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Feedback</FormLabel>
                        <FormControl>
                          <Textarea
                            className="resize-none"
                            placeholder="Tell us about your experience, suggestions, or any issues you've encountered..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    className="w-full"
                    disabled={submitFeedbackMutation.isPending}
                    type="submit"
                  >
                    {submitFeedbackMutation.isPending
                      ? 'Submitting...'
                      : 'Submit Feedback'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

function Header() {
  const { organizationSlug } = Route.useParams();

  return (
    <DashboardHeader>
      <BreadcrumbItem>
        <BreadcrumbLink asChild title="Feedback">
          <Link params={{ organizationSlug }} to="/$organizationSlug/feedback">
            Feedback
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
    </DashboardHeader>
  );
}
