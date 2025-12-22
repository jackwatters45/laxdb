import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Calendar,
  Clock,
  Eye,
  Filter,
  Plus,
  Search,
  Star,
  Target,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute(
  '/_protected/$organizationSlug/practice/templates/'
)({
  component: PracticeTemplatesPage,
});

type PracticeTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  drillCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  focus: string[];
  rating: number;
  usageCount: number;
  lastUsed: string | null;
  isDefault: boolean;
  drills: {
    id: string;
    name: string;
    duration: number;
    category: string;
  }[];
};

const mockTemplates: PracticeTemplate[] = [
  {
    id: '1',
    name: 'Beginner Skills Foundation',
    description:
      'Essential skills practice for new players focusing on catching, throwing, and basic stick handling',
    category: 'Skills Development',
    duration: 90,
    drillCount: 8,
    difficulty: 'Beginner',
    focus: ['Catching', 'Throwing', 'Stick Skills'],
    rating: 4.7,
    usageCount: 24,
    lastUsed: '2024-03-18',
    isDefault: true,
    drills: [
      {
        id: 'd1',
        name: 'Wall Ball Basics',
        duration: 15,
        category: 'Stick Skills',
      },
      { id: 'd2', name: 'Partner Passing', duration: 20, category: 'Passing' },
      {
        id: 'd3',
        name: 'Ground Ball Pickup',
        duration: 15,
        category: 'Ground Balls',
      },
      {
        id: 'd4',
        name: 'Basic Shooting Form',
        duration: 20,
        category: 'Shooting',
      },
    ],
  },
  {
    id: '2',
    name: 'Game Situation Training',
    description:
      'Fast-paced practice focusing on game-like scenarios and decision making under pressure',
    category: 'Game Situations',
    duration: 120,
    drillCount: 12,
    difficulty: 'Advanced',
    focus: ['Decision Making', 'Fast Break', '6v6 Situations'],
    rating: 4.9,
    usageCount: 18,
    lastUsed: '2024-03-15',
    isDefault: false,
    drills: [
      {
        id: 'd5',
        name: '4v3 Fast Break',
        duration: 20,
        category: 'Fast Break',
      },
      {
        id: 'd6',
        name: 'Clear Situations',
        duration: 25,
        category: 'Clearing',
      },
      { id: 'd7', name: '6v6 Settled', duration: 30, category: 'Offense' },
    ],
  },
  {
    id: '3',
    name: 'Defensive Fundamentals',
    description:
      'Comprehensive defensive training covering individual and team defensive concepts',
    category: 'Defense',
    duration: 105,
    drillCount: 10,
    difficulty: 'Intermediate',
    focus: ['Individual Defense', 'Team Defense', 'Communication'],
    rating: 4.5,
    usageCount: 15,
    lastUsed: '2024-03-12',
    isDefault: true,
    drills: [
      { id: 'd8', name: '1v1 Defense', duration: 15, category: 'Defense' },
      {
        id: 'd9',
        name: 'Slide Package',
        duration: 25,
        category: 'Team Defense',
      },
      {
        id: 'd10',
        name: 'Defensive Communication',
        duration: 20,
        category: 'Defense',
      },
    ],
  },
  {
    id: '4',
    name: 'Conditioning & Agility',
    description:
      'High-intensity practice focused on building endurance, speed, and agility with lacrosse-specific movements',
    category: 'Conditioning',
    duration: 75,
    drillCount: 6,
    difficulty: 'Intermediate',
    focus: ['Endurance', 'Speed', 'Agility'],
    rating: 4.2,
    usageCount: 12,
    lastUsed: '2024-03-10',
    isDefault: false,
    drills: [
      { id: 'd11', name: 'Ladder Drills', duration: 15, category: 'Agility' },
      {
        id: 'd12',
        name: 'Sprint Intervals',
        duration: 20,
        category: 'Conditioning',
      },
      {
        id: 'd13',
        name: 'Shuttle Runs',
        duration: 15,
        category: 'Conditioning',
      },
    ],
  },
  {
    id: '5',
    name: 'Pre-Game Warmup',
    description:
      'Standard warmup routine to prepare players for games with dynamic movements and skill activation',
    category: 'Warmup',
    duration: 45,
    drillCount: 5,
    difficulty: 'Beginner',
    focus: ['Warmup', 'Dynamic Movement', 'Skill Activation'],
    rating: 4.8,
    usageCount: 32,
    lastUsed: '2024-03-17',
    isDefault: true,
    drills: [
      {
        id: 'd14',
        name: 'Dynamic Stretching',
        duration: 10,
        category: 'Warmup',
      },
      { id: 'd15', name: 'Light Passing', duration: 15, category: 'Passing' },
      {
        id: 'd16',
        name: 'Shooting Warmup',
        duration: 15,
        category: 'Shooting',
      },
    ],
  },
  {
    id: '6',
    name: 'Offensive Systems',
    description:
      'Advanced offensive strategies and plays including motion offense and set plays',
    category: 'Offense',
    duration: 100,
    drillCount: 9,
    difficulty: 'Advanced',
    focus: ['Motion Offense', 'Set Plays', 'Ball Movement'],
    rating: 4.6,
    usageCount: 9,
    lastUsed: '2024-03-08',
    isDefault: false,
    drills: [
      { id: 'd17', name: 'Motion Offense', duration: 25, category: 'Offense' },
      { id: 'd18', name: 'Inbound Plays', duration: 20, category: 'Set Plays' },
      { id: 'd19', name: 'Pick and Roll', duration: 20, category: 'Offense' },
    ],
  },
];

const categories = [
  'All Categories',
  'Skills Development',
  'Game Situations',
  'Defense',
  'Conditioning',
  'Warmup',
  'Offense',
];
const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

function PracticeTemplatesPage() {
  const { organizationSlug } = Route.useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [sortBy, setSortBy] = useState('recent');

  const filteredTemplates = mockTemplates
    .filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        template.focus.some((f) =>
          f.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesCategory =
        selectedCategory === 'All Categories' ||
        template.category === selectedCategory;
      const matchesDifficulty =
        selectedDifficulty === 'All Levels' ||
        template.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (!(a.lastUsed || b.lastUsed)) {
            return 0;
          }
          if (!a.lastUsed) {
            return 1;
          }
          if (!b.lastUsed) {
            return -1;
          }
          return (
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
          );
        case 'rating':
          return b.rating - a.rating;
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Practice Templates</h1>
          <p className="text-muted-foreground">
            Pre-built practice plans ready to schedule
          </p>
        </div>
        <Button asChild>
          <Link
            params={{ organizationSlug }}
            to="/$organizationSlug/practice/templates/create"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-64 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              value={searchQuery}
            />
          </div>
          <div className="relative">
            <Filter className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <select
              className="w-48 rounded-md border border-input bg-background py-2 pr-4 pl-10 text-sm"
              onChange={(e) => setSelectedCategory(e.target.value)}
              value={selectedCategory}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <select
            className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            value={selectedDifficulty}
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>

        <select
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(e) => setSortBy(e.target.value)}
          value={sortBy}
        >
          <option value="recent">Recently Used</option>
          <option value="rating">Highest Rated</option>
          <option value="usage">Most Used</option>
          <option value="name">Name A-Z</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card className="transition-shadow hover:shadow-md" key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight">
                    {template.name}
                    {template.isDefault && (
                      <Badge className="ml-2 text-xs" variant="secondary">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {template.description}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Badge className="text-xs" variant="outline">
                  {template.category}
                </Badge>
                <Badge
                  className={`text-xs ${getDifficultyColor(template.difficulty)}`}
                >
                  {template.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{template.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{template.drillCount} drills</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{template.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Used {template.usageCount}x</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Focus Areas:</p>
                <div className="flex flex-wrap gap-1">
                  {template.focus.map((focus) => (
                    <Badge className="text-xs" key={focus} variant="secondary">
                      {focus}
                    </Badge>
                  ))}
                </div>
              </div>

              {template.lastUsed && (
                <p className="text-muted-foreground text-xs">
                  Last used: {new Date(template.lastUsed).toLocaleDateString()}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button asChild className="flex-1" size="sm" variant="outline">
                  <Link
                    params={{ organizationSlug, templateId: template.id }}
                    to="/$organizationSlug/practice/templates/$templateId"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button asChild className="flex-1" size="sm">
                  <Link
                    params={{ organizationSlug }}
                    search={{ templateId: template.id }}
                    to="/$organizationSlug/practice/schedule/create"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold text-lg">No templates found</h3>
          <p className="mb-4 text-muted-foreground">
            Try adjusting your search criteria or create a new template.
          </p>
          <Button asChild>
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/practice/templates/create"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
