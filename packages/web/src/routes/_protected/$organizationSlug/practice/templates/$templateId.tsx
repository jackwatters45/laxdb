import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Edit,
  Play,
  Star,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/practice/templates/$templateId'
)({
  component: TemplateDetailPage,
});

type TemplateDetail = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  focus: string[];
  rating: number;
  usageCount: number;
  lastUsed: string | null;
  isDefault: boolean;
  createdDate: string;
  createdBy: string;
  notes: string;
  drills: TemplateDrill[];
};

type TemplateDrill = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  order: number;
  difficulty: string;
  playerCount: { min: number; max: number };
  equipment: string[];
  skills: string[];
  effectiveness: number;
  instructions: string;
};

const mockTemplate: TemplateDetail = {
  id: '1',
  name: 'Beginner Skills Foundation',
  description:
    'Essential skills practice for new players focusing on catching, throwing, and basic stick handling. This comprehensive template covers all fundamental lacrosse skills needed for player development.',
  category: 'Skills Development',
  duration: 90,
  difficulty: 'Beginner',
  focus: ['Catching', 'Throwing', 'Stick Skills'],
  rating: 4.7,
  usageCount: 24,
  lastUsed: '2024-03-18',
  isDefault: true,
  createdDate: '2024-02-15',
  createdBy: 'Coach Johnson',
  notes:
    'Perfect for first-time players or early season practice. Focus on proper form over speed. Allow extra time for demonstrations.',
  drills: [
    {
      id: 'd1',
      name: 'Wall Ball Basics',
      description:
        'Fundamental wall ball technique for developing stick skills and hand-eye coordination',
      category: 'Stick Skills',
      duration: 15,
      order: 0,
      difficulty: 'Beginner',
      playerCount: { min: 1, max: 1 },
      equipment: ['Wall', 'Lacrosse Ball'],
      skills: ['Catching', 'Throwing', 'Hand-Eye Coordination'],
      effectiveness: 4.8,
      instructions:
        'Stand 5 feet from wall. Focus on proper catching technique and smooth release.',
    },
    {
      id: 'd2',
      name: 'Partner Passing',
      description:
        'Basic passing and catching with a partner to develop accuracy and timing',
      category: 'Passing',
      duration: 20,
      order: 1,
      difficulty: 'Beginner',
      playerCount: { min: 2, max: 2 },
      equipment: ['Lacrosse Ball'],
      skills: ['Passing', 'Catching', 'Communication'],
      effectiveness: 4.5,
      instructions:
        'Start 10 yards apart. Emphasize proper passing form and soft hands on catches.',
    },
    {
      id: 'd3',
      name: 'Ground Ball Pickup',
      description:
        'Proper technique for scooping ground balls with body positioning',
      category: 'Ground Balls',
      duration: 15,
      order: 2,
      difficulty: 'Beginner',
      playerCount: { min: 1, max: 12 },
      equipment: ['Lacrosse Ball'],
      skills: ['Ground Balls', 'Body Position', 'Stick Position'],
      effectiveness: 4.6,
      instructions:
        'Emphasize getting body over ball, stick parallel to ground, and protecting possession.',
    },
    {
      id: 'd4',
      name: 'Basic Shooting Form',
      description:
        'Fundamental shooting technique focusing on accuracy over power',
      category: 'Shooting',
      duration: 20,
      order: 3,
      difficulty: 'Beginner',
      playerCount: { min: 1, max: 6 },
      equipment: ['Goal', 'Lacrosse Ball'],
      skills: ['Shooting', 'Accuracy', 'Follow Through'],
      effectiveness: 4.7,
      instructions:
        'Start close to goal. Focus on proper form, step to target, and follow through.',
    },
    {
      id: 'd5',
      name: 'Stick Skills Relay',
      description: 'Fun competitive drill combining multiple stick skills',
      category: 'Conditioning',
      duration: 10,
      order: 4,
      difficulty: 'Beginner',
      playerCount: { min: 6, max: 20 },
      equipment: ['Cones', 'Lacrosse Ball'],
      skills: ['Stick Skills', 'Conditioning', 'Competition'],
      effectiveness: 4.3,
      instructions:
        'Set up stations with different skills. Teams rotate through challenges.',
    },
    {
      id: 'd6',
      name: 'Cool Down Passing',
      description: 'Light passing to end practice on a positive note',
      category: 'Warmup',
      duration: 10,
      order: 5,
      difficulty: 'Beginner',
      playerCount: { min: 2, max: 20 },
      equipment: ['Lacrosse Ball'],
      skills: ['Passing', 'Catching', 'Relaxation'],
      effectiveness: 4.1,
      instructions:
        'Easy passing in circle or lines. Focus on fun and positive reinforcement.',
    },
  ],
};

function TemplateDetailPage() {
  const template = mockTemplate;
  const totalDuration = template.drills.reduce(
    (sum, drill) => sum + drill.duration,
    0
  );

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button size="sm" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            <h1 className="font-bold text-3xl">{template.name}</h1>
            {template.isDefault && (
              <Badge variant="secondary">Default Template</Badge>
            )}
            <Badge className={getDifficultyColor(template.difficulty)}>
              {template.difficulty}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {template.category} • {template.drills.length} drills •{' '}
            {totalDuration} minutes
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Practice
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium">Description</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {template.description}
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {template.focus.map((focus) => (
                    <Badge className="text-xs" key={focus} variant="secondary">
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>

              {template.notes && (
                <div>
                  <h4 className="mb-2 font-medium">Coaching Notes</h4>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-blue-800 text-sm">{template.notes}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Target Duration: {template.duration} min</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Actual Duration: {totalDuration} min</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Rating: {template.rating}/5.0</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Used {template.usageCount} times</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Practice Drills</span>
                <Badge className="text-sm" variant="outline">
                  {template.drills.length} drills • {totalDuration} min total
                </Badge>
              </CardTitle>
              <CardDescription>
                Drills are listed in recommended order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.drills.map((drill, index) => (
                  <div className="rounded-lg border p-4" key={drill.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-sm">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="font-medium">{drill.name}</h4>
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
                          </div>
                          <div className="text-right">
                            <div className="mb-1 flex items-center gap-1 text-muted-foreground text-sm">
                              <Clock className="h-3 w-3" />
                              <span>{drill.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Users className="h-3 w-3" />
                              <span>
                                {drill.playerCount.min}-{drill.playerCount.max}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                          <div>
                            <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                              Equipment
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {drill.equipment.map((item) => (
                                <Badge
                                  className="text-xs"
                                  key={item}
                                  variant="outline"
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                              Skills Developed
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {drill.skills.map((skill) => (
                                <Badge
                                  className="text-xs"
                                  key={skill}
                                  variant="secondary"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                              Effectiveness
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-sm">
                                {drill.effectiveness}/5.0
                              </span>
                            </div>
                          </div>
                        </div>

                        {drill.instructions && (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                              Instructions
                            </p>
                            <p className="text-sm">{drill.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="sm">
                <Play className="mr-2 h-4 w-4" />
                Start Practice Now
              </Button>
              <Button className="w-full" size="sm" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule for Later
              </Button>
              <Button className="w-full" size="sm" variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Template
              </Button>
              <Button className="w-full" size="sm" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(template.createdDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created by:</span>
                  <span>{template.createdBy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last used:</span>
                  <span>
                    {template.lastUsed
                      ? formatDate(template.lastUsed)
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Times used:</span>
                  <span>{template.usageCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average rating:</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {template.rating}/5.0
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duration Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Target Duration:
                  </span>
                  <span className="font-medium">{template.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Actual Duration:
                  </span>
                  <span className="font-medium">{totalDuration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Difference:</span>
                  <span
                    className={`font-medium ${Math.abs(totalDuration - template.duration) > 10 ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {totalDuration - template.duration > 0 ? '+' : ''}
                    {totalDuration - template.duration} min
                  </span>
                </div>

                <div className="border-t pt-2">
                  <div className="space-y-2">
                    {template.drills.map((drill) => (
                      <div
                        className="flex items-center justify-between text-xs"
                        key={drill.id}
                      >
                        <span className="mr-2 flex-1 truncate text-muted-foreground">
                          {drill.name}
                        </span>
                        <span className="font-medium">{drill.duration}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                size="sm"
                variant="outline"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
