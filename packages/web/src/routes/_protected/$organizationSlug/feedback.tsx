import { effectTsResolver } from "@hookform/resolvers/effect-ts";
import { RATING_ENUM, TOPIC_ENUM } from "@laxdb/core/feedback/feedback.schema";
import { FeedbackService } from "@laxdb/core/feedback/feedback.service";
import { RuntimeServer } from "@laxdb/core/runtime.server";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageBody } from "@/components/layout/page-content";
import { DashboardHeader } from "@/components/sidebar/dashboard-header";
import {
  BreadcrumbItem,
  BreadcrumbLink,
} from "@laxdb/ui/components/ui/breadcrumb";
import { Button } from "@laxdb/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@laxdb/ui/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@laxdb/ui/components/ui/field";
import { Label } from "@laxdb/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@laxdb/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@laxdb/ui/components/ui/select";
import { Textarea } from "@laxdb/ui/components/ui/textarea";
import { authMiddleware } from "@/lib/middleware";

const FeedbackSchema = Schema.Struct({
  topic: Schema.Literal(...TOPIC_ENUM),
  rating: Schema.Literal(...RATING_ENUM),
  feedback: Schema.String.pipe(
    Schema.minLength(10, {
      message: () => "Feedback must be at least 10 characters long",
    }),
  ),
});

type FeedbackFormValues = typeof FeedbackSchema.Type;

const submitFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: FeedbackFormValues) =>
    Schema.decodeSync(FeedbackSchema)(data),
  )
  .handler(({ data, context: { session } }) =>
    RuntimeServer.runPromise(
      Effect.gen(function* () {
        const feedbackService = yield* FeedbackService;

        const feedbackData = {
          ...data,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
        };

        return yield* feedbackService.create(feedbackData);
      }),
    ),
  );

export const Route = createFileRoute("/_protected/$organizationSlug/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const router = useRouter();

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: FeedbackFormValues) => submitFeedback({ data }),
    onSuccess: async () => {
      toast.success("Thank you for your feedback! We appreciate your input.");
      await router.navigate({ href: "/teams" });
    },
    onError: () => {
      toast.error(
        "There was an error submitting your feedback. Please try again.",
      );
    },
  });

  const form = useForm<FeedbackFormValues>({
    resolver: effectTsResolver(FeedbackSchema),
    defaultValues: {
      feedback: "",
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
              <form
                className="space-y-6"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FieldGroup>
                  <Controller
                    name="topic"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="feedback-topic">Topic</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="feedback-topic"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue>
                              {(value: string | null) =>
                                value ?? "Select a topic"
                              }
                            </SelectValue>
                          </SelectTrigger>
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
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="rating"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Rating</FieldLabel>
                        <RadioGroup
                          className="flex flex-col gap-3"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="positive"
                              id="rating-positive"
                            />
                            <Label
                              htmlFor="rating-positive"
                              className="font-normal text-green-600"
                            >
                              Positive - I&apos;m happy with this
                              feature/experience
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="neutral"
                              id="rating-neutral"
                            />
                            <Label
                              htmlFor="rating-neutral"
                              className="font-normal text-yellow-600"
                            >
                              Neutral - It&apos;s okay, but could be improved
                            </Label>
                          </div>
                          <div className="flex items-center gap-3">
                            <RadioGroupItem
                              value="negative"
                              id="rating-negative"
                            />
                            <Label
                              htmlFor="rating-negative"
                              className="font-normal text-red-600"
                            >
                              Negative - I&apos;m frustrated or encountering
                              issues
                            </Label>
                          </div>
                        </RadioGroup>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="feedback"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="feedback-text">
                          Your Feedback
                        </FieldLabel>
                        <Textarea
                          {...field}
                          id="feedback-text"
                          className="resize-none"
                          placeholder="Tell us about your experience, suggestions, or any issues you've encountered..."
                          rows={6}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>

                <Button
                  className="w-full"
                  disabled={submitFeedbackMutation.isPending}
                  type="submit"
                >
                  {submitFeedbackMutation.isPending
                    ? "Submitting..."
                    : "Submit Feedback"}
                </Button>
              </form>
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
        <BreadcrumbLink
          title="Feedback"
          render={
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/feedback"
            />
          }
        >
          Feedback
        </BreadcrumbLink>
      </BreadcrumbItem>
    </DashboardHeader>
  );
}
