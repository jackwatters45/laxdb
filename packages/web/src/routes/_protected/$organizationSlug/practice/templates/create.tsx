import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Schema } from 'effect';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  Search,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const templateFormSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Template name is required' })
  ),
  description: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Description is required' })
  ),
  category: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Category is required' })
  ),
  difficulty: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Difficulty level is required' })
  ),
  duration: Schema.Number.pipe(
    Schema.greaterThanOrEqualTo(1, {
      message: () => 'Duration must be at least 1 minute',
    })
  ),
  focus: Schema.Array(Schema.String).pipe(
    Schema.minItems(1, {
      message: () => 'At least one focus area is required',
    })
  ),
  notes: Schema.optional(Schema.String),
});

type TemplateFormData = typeof templateFormSchema.Type;

type SelectedDrill = {
  id: string;
  name: string;
  category: string;
  duration: number;
  order: number;
};

type Drill = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string[];
  skills: string[];
  playerCount: { min: number; max: number };
  effectiveness: number;
};

type TemplateSubmitData = TemplateFormData & {
  selectedDrills: SelectedDrill[];
};

const createTemplate = createServerFn({ method: 'POST' })
  .inputValidator((data: TemplateSubmitData) => data)
  .handler(async ({ data }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, templateId: 'new-template-id' };
  });

export const Route = createFileRoute(
  '/_protected/$organizationSlug/practice/templates/create'
)({
  component: CreateTemplatePage,
});

const mockDrills: Drill[] = [
  {
    id: '1',
    name: 'Wall Ball Basics',
    description: 'Fundamental wall ball technique for developing stick skills',
    category: 'Stick Skills',
    duration: 15,
    difficulty: 'Beginner',
    equipment: ['Wall', 'Lacrosse Ball'],
    skills: ['Catching', 'Throwing', 'Hand-Eye Coordination'],
    playerCount: { min: 1, max: 1 },
    effectiveness: 4.8,
  },
  {
    id: '2',
    name: 'Partner Passing',
    description: 'Basic passing and catching with a partner',
    category: 'Passing',
    duration: 20,
    difficulty: 'Beginner',
    equipment: ['Lacrosse Ball'],
    skills: ['Passing', 'Catching', 'Communication'],
    playerCount: { min: 2, max: 2 },
    effectiveness: 4.5,
  },
  {
    id: '3',
    name: 'Ground Ball Pickup',
    description: 'Proper technique for scooping ground balls',
    category: 'Ground Balls',
    duration: 15,
    difficulty: 'Beginner',
    equipment: ['Lacrosse Ball'],
    skills: ['Ground Balls', 'Body Position', 'Stick Position'],
    playerCount: { min: 1, max: 12 },
    effectiveness: 4.6,
  },
  {
    id: '4',
    name: 'Basic Shooting Form',
    description: 'Fundamental shooting technique and accuracy',
    category: 'Shooting',
    duration: 20,
    difficulty: 'Beginner',
    equipment: ['Goal', 'Lacrosse Ball'],
    skills: ['Shooting', 'Accuracy', 'Follow Through'],
    playerCount: { min: 1, max: 6 },
    effectiveness: 4.7,
  },
  {
    id: '5',
    name: '4v3 Fast Break',
    description: 'Fast break execution with numerical advantage',
    category: 'Fast Break',
    duration: 20,
    difficulty: 'Advanced',
    equipment: ['Goals', 'Lacrosse Ball'],
    skills: ['Fast Break', 'Decision Making', 'Ball Movement'],
    playerCount: { min: 7, max: 7 },
    effectiveness: 4.9,
  },
  {
    id: '6',
    name: 'Clear Situations',
    description: 'Clearing the ball from defensive end',
    category: 'Clearing',
    duration: 25,
    difficulty: 'Intermediate',
    equipment: ['Full Field', 'Lacrosse Ball'],
    skills: ['Clearing', 'Ball Security', 'Field Vision'],
    playerCount: { min: 6, max: 12 },
    effectiveness: 4.4,
  },
  {
    id: '7',
    name: '6v6 Settled',
    description: 'Full field settled offense vs defense',
    category: 'Offense',
    duration: 30,
    difficulty: 'Advanced',
    equipment: ['Full Field', 'Goals', 'Lacrosse Ball'],
    skills: ['Offense', 'Defense', 'Ball Movement', 'Communication'],
    playerCount: { min: 12, max: 12 },
    effectiveness: 4.8,
  },
  {
    id: '8',
    name: '1v1 Defense',
    description: 'Individual defensive fundamentals',
    category: 'Defense',
    duration: 15,
    difficulty: 'Intermediate',
    equipment: ['Lacrosse Ball'],
    skills: ['Individual Defense', 'Body Position', 'Stick Checks'],
    playerCount: { min: 2, max: 8 },
    effectiveness: 4.5,
  },
];

const categories = [
  'Skills Development',
  'Game Situations',
  'Defense',
  'Conditioning',
  'Warmup',
  'Offense',
];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const drillCategories = [
  'All Categories',
  'Stick Skills',
  'Passing',
  'Ground Balls',
  'Shooting',
  'Fast Break',
  'Clearing',
  'Offense',
  'Defense',
];
const focusAreas = [
  'Catching',
  'Throwing',
  'Stick Skills',
  'Decision Making',
  'Fast Break',
  '6v6 Situations',
  'Individual Defense',
  'Team Defense',
  'Communication',
  'Endurance',
  'Speed',
  'Agility',
  'Warmup',
  'Dynamic Movement',
  'Skill Activation',
  'Motion Offense',
  'Set Plays',
  'Ball Movement',
];

function CreateTemplatePage() {
  const { organizationSlug } = Route.useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrillCategory, setSelectedDrillCategory] =
    useState('All Categories');
  const [selectedDrills, setSelectedDrills] = useState<SelectedDrill[]>([]);
  const [currentFocus, setCurrentFocus] = useState('');
  const [showDrillSelector, setShowDrillSelector] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: effectTsResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Skills Development',
      difficulty: 'Beginner',
      duration: 90,
      focus: [],
      notes: '',
    },
  });

  const filteredDrills = mockDrills.filter((drill) => {
    const matchesSearch =
      drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedDrillCategory === 'All Categories' ||
      drill.category === selectedDrillCategory;
    const notAlreadySelected = !selectedDrills.some(
      (selected) => selected.id === drill.id
    );

    return matchesSearch && matchesCategory && notAlreadySelected;
  });

  const addDrill = (drill: Drill) => {
    const selectedDrill: SelectedDrill = {
      id: drill.id,
      name: drill.name,
      category: drill.category,
      duration: drill.duration,
      order: selectedDrills.length,
    };
    setSelectedDrills([...selectedDrills, selectedDrill]);
  };

  const removeDrill = (drillId: string) => {
    setSelectedDrills(selectedDrills.filter((drill) => drill.id !== drillId));
  };

  const moveDrill = (drillId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedDrills.findIndex(
      (drill) => drill.id === drillId
    );
    if (currentIndex === -1) {
      return;
    }

    const newDrills = [...selectedDrills];
    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < newDrills.length) {
      [newDrills[currentIndex]!, newDrills[targetIndex]!] = [
        newDrills[targetIndex]!,
        newDrills[currentIndex]!,
      ];
      setSelectedDrills(newDrills);
    }
  };

  const addFocusArea = () => {
    if (currentFocus && !form.getValues('focus').includes(currentFocus)) {
      const currentFocusAreas = form.getValues('focus');
      form.setValue('focus', [...currentFocusAreas, currentFocus]);
      setCurrentFocus('');
    }
  };

  const removeFocusArea = (focusToRemove: string) => {
    const currentFocusAreas = form.getValues('focus');
    form.setValue(
      'focus',
      currentFocusAreas.filter((focus) => focus !== focusToRemove)
    );
  };

  const totalDuration = selectedDrills.reduce(
    (sum, drill) => sum + drill.duration,
    0
  );

  const onSubmit = async (data: TemplateFormData) => {
    if (selectedDrills.length === 0) {
      form.setError('root', {
        type: 'manual',
        message: 'Please select at least one drill',
      });
      return;
    }

    const templateData: TemplateSubmitData = {
      ...data,
      selectedDrills,
    };

    try {
      const result = await createTemplate({ data: templateData });
      if (result.success) {
        router.navigate({
          to: '/$organizationSlug/practice/templates',
          params: { organizationSlug },
        });
      }
    } catch (_error) {
      form.setError('root', {
        type: 'manual',
        message: 'Failed to create template. Please try again.',
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild size="sm" variant="outline">
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/practice/templates"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
        <div>
          <h1 className="font-bold text-3xl">Create Practice Template</h1>
          <p className="text-muted-foreground">
            Build a reusable practice plan with drills and timing
          </p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                  <CardDescription>
                    Basic information about your practice template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Beginner Skills Foundation"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the purpose and focus of this template..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select
                            defaultValue={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {difficulties.map((difficulty) => (
                                <SelectItem key={difficulty} value={difficulty}>
                                  {difficulty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="90"
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="focus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focus Areas</FormLabel>
                        <div className="mb-2 flex gap-2">
                          <Select
                            onValueChange={setCurrentFocus}
                            value={currentFocus}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select focus area..." />
                            </SelectTrigger>
                            <SelectContent>
                              {focusAreas.map((focus) => (
                                <SelectItem key={focus} value={focus}>
                                  {focus}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            disabled={!currentFocus}
                            onClick={addFocusArea}
                            size="sm"
                            type="button"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((focus) => (
                            <Badge
                              className="text-xs"
                              key={focus}
                              variant="secondary"
                            >
                              {focus}
                              <button
                                className="ml-1 hover:text-destructive"
                                onClick={() => removeFocusArea(focus)}
                                type="button"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Practice Drills</span>
                    <Badge className="text-sm" variant="outline">
                      {selectedDrills.length} drills, {totalDuration} min
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Select and organize drills for your practice template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedDrills.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Target className="mx-auto mb-2 h-12 w-12" />
                      <p>No drills selected yet</p>
                      <p className="text-sm">
                        Use the drill selector below to add drills
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDrills.map((drill, index) => (
                        <div
                          className="flex items-center gap-3 rounded-lg border p-3"
                          key={drill.id}
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              className="h-6 w-6 p-0"
                              disabled={index === 0}
                              onClick={() => moveDrill(drill.id, 'up')}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              className="h-6 w-6 p-0"
                              disabled={index === selectedDrills.length - 1}
                              onClick={() => moveDrill(drill.id, 'down')}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium">{drill.name}</span>
                              <Badge className="text-xs" variant="outline">
                                {drill.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{drill.duration} min</span>
                            </div>
                          </div>

                          <Button
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeDrill(drill.id)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <Button
                      className="w-full"
                      onClick={() => setShowDrillSelector(!showDrillSelector)}
                      type="button"
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {showDrillSelector ? 'Hide' : 'Add'} Drill Selector
                    </Button>

                    {showDrillSelector && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-10"
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search drills..."
                              value={searchQuery}
                            />
                          </div>
                          <select
                            className="w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            onChange={(e) =>
                              setSelectedDrillCategory(e.target.value)
                            }
                            value={selectedDrillCategory}
                          >
                            {drillCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid max-h-64 gap-3 overflow-y-auto">
                          {filteredDrills.map((drill) => (
                            <div
                              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                              key={drill.id}
                            >
                              <div className="flex-1">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className="font-medium">
                                    {drill.name}
                                  </span>
                                  <Badge className="text-xs" variant="outline">
                                    {drill.category}
                                  </Badge>
                                  <Badge
                                    className={`text-xs ${getDifficultyColor(drill.difficulty)}`}
                                  >
                                    {drill.difficulty}
                                  </Badge>
                                </div>
                                <p className="mb-2 text-muted-foreground text-sm">
                                  {drill.description}
                                </p>
                                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{drill.duration} min</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>
                                      {drill.playerCount.min}-
                                      {drill.playerCount.max} players
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => addDrill(drill)}
                                size="sm"
                                type="button"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {filteredDrills.length === 0 && (
                            <p className="py-4 text-center text-muted-foreground">
                              No drills found matching your criteria
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                  <CardDescription>
                    Any additional instructions or notes for this template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Add any coaching notes, setup instructions, or reminders..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Drills:
                      </span>
                      <span className="font-medium">
                        {selectedDrills.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Total Duration:
                      </span>
                      <span className="font-medium">
                        {totalDuration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Target Duration:
                      </span>
                      <span className="font-medium">
                        {form.watch('duration')} minutes
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Time Difference:
                      </span>
                      <span
                        className={`font-medium ${Math.abs(totalDuration - form.watch('duration')) > 10 ? 'text-amber-600' : 'text-green-600'}`}
                      >
                        {totalDuration - form.watch('duration') > 0 ? '+' : ''}
                        {totalDuration - form.watch('duration')} min
                      </span>
                    </div>
                  </div>

                  {Math.abs(totalDuration - form.watch('duration')) > 15 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
                      <p className="mb-1 font-medium">Duration Mismatch</p>
                      <p>
                        Your selected drills duration differs significantly from
                        your target duration.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="font-medium text-sm">Focus Areas:</p>
                    <div className="flex flex-wrap gap-1">
                      {form.watch('focus').map((focus) => (
                        <Badge
                          className="text-xs"
                          key={focus}
                          variant="secondary"
                        >
                          {focus}
                        </Badge>
                      ))}
                      {form.watch('focus').length === 0 && (
                        <span className="text-muted-foreground text-xs">
                          None selected
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                {form.formState.errors.root && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
                    {form.formState.errors.root.message}
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {form.formState.isSubmitting
                    ? 'Creating...'
                    : 'Create Template'}
                </Button>
                <Button
                  asChild
                  className="w-full"
                  type="button"
                  variant="outline"
                >
                  <Link
                    params={{ organizationSlug }}
                    to="/$organizationSlug/practice/templates"
                  >
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
