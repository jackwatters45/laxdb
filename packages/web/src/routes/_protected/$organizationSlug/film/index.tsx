import { createFileRoute } from '@tanstack/react-router';
import {
  Calendar,
  Download,
  Eye,
  FileVideo,
  MoreHorizontal,
  Play,
  PlayCircle,
  Search,
  Upload,
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

export const Route = createFileRoute('/_protected/$organizationSlug/film/')({
  component: FilmLibraryPage,
});

type GameFilm = {
  id: string;
  title: string;
  gameDate: string;
  opponent: string;
  gameType: 'Regular Season' | 'Playoff' | 'Scrimmage' | 'Practice';
  duration: number;
  uploadDate: string;
  uploadedBy: string;
  fileSize: string;
  resolution: string;
  format: string;
  thumbnail: string;
  description: string;
  tags: string[];
  events: FilmEvent[];
  views: number;
  isAnalyzed: boolean;
};

type FilmEvent = {
  id: string;
  timestamp: number;
  type:
    | 'goal'
    | 'assist'
    | 'save'
    | 'penalty'
    | 'substitution'
    | 'timeout'
    | 'highlight';
  player?: string;
  description: string;
  quarter: number;
};

const mockFilms: GameFilm[] = [
  {
    id: '1',
    title: 'vs Eagles - Championship Game',
    gameDate: '2024-03-22',
    opponent: 'Central Eagles',
    gameType: 'Playoff',
    duration: 3600, // 60 minutes
    uploadDate: '2024-03-23',
    uploadedBy: 'Coach Johnson',
    fileSize: '2.4 GB',
    resolution: '1080p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'Championship game footage with complete game coverage. Excellent defensive play in 2nd half.',
    tags: ['championship', 'defense', 'playoff'],
    events: [
      {
        id: 'e1',
        timestamp: 300,
        type: 'goal',
        player: 'Jake Smith',
        description: 'First goal of the game',
        quarter: 1,
      },
      {
        id: 'e2',
        timestamp: 850,
        type: 'save',
        player: 'Mike Wilson',
        description: 'Outstanding save',
        quarter: 1,
      },
      {
        id: 'e3',
        timestamp: 1200,
        type: 'penalty',
        player: 'Tom Davis',
        description: 'Slashing penalty',
        quarter: 2,
      },
    ],
    views: 87,
    isAnalyzed: true,
  },
  {
    id: '2',
    title: 'vs Wildcats - Regular Season',
    gameDate: '2024-03-15',
    opponent: 'North Wildcats',
    gameType: 'Regular Season',
    duration: 3480,
    uploadDate: '2024-03-16',
    uploadedBy: 'Assistant Coach Brown',
    fileSize: '1.9 GB',
    resolution: '720p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'Strong offensive performance. Multiple fast break opportunities.',
    tags: ['offense', 'fast-break', 'regular-season'],
    events: [
      {
        id: 'e4',
        timestamp: 420,
        type: 'goal',
        player: 'Alex Johnson',
        description: 'Fast break goal',
        quarter: 1,
      },
      {
        id: 'e5',
        timestamp: 1800,
        type: 'assist',
        player: 'Ryan Lee',
        description: 'Behind-the-back assist',
        quarter: 2,
      },
    ],
    views: 52,
    isAnalyzed: true,
  },
  {
    id: '3',
    title: 'Practice Scrimmage - Red vs Blue',
    gameDate: '2024-03-10',
    opponent: 'Internal Scrimmage',
    gameType: 'Practice',
    duration: 2700,
    uploadDate: '2024-03-10',
    uploadedBy: 'Coach Johnson',
    fileSize: '1.2 GB',
    resolution: '1080p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description: 'Internal scrimmage focusing on new offensive sets.',
    tags: ['scrimmage', 'practice', 'offense-sets'],
    events: [],
    views: 23,
    isAnalyzed: false,
  },
  {
    id: '4',
    title: 'vs Thunder - Overtime Thriller',
    gameDate: '2024-03-08',
    opponent: 'Western Thunder',
    gameType: 'Regular Season',
    duration: 4200,
    uploadDate: '2024-03-09',
    uploadedBy: 'Manager Steve',
    fileSize: '3.1 GB',
    resolution: '1080p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'Intense overtime game with clutch performances. Great learning material.',
    tags: ['overtime', 'clutch', 'high-pressure'],
    events: [
      {
        id: 'e6',
        timestamp: 3900,
        type: 'goal',
        player: 'Marcus Williams',
        description: 'Overtime winner',
        quarter: 5,
      },
      {
        id: 'e7',
        timestamp: 3600,
        type: 'timeout',
        description: 'Crucial timeout before OT',
        quarter: 4,
      },
    ],
    views: 104,
    isAnalyzed: true,
  },
  {
    id: '5',
    title: 'vs Lions - Season Opener',
    gameDate: '2024-02-28',
    opponent: 'Metro Lions',
    gameType: 'Regular Season',
    duration: 3300,
    uploadDate: '2024-03-01',
    uploadedBy: 'Coach Johnson',
    fileSize: '2.0 GB',
    resolution: '720p',
    format: 'MP4',
    thumbnail: '/api/placeholder/320/180',
    description:
      'First game of the season. Good baseline for player development tracking.',
    tags: ['season-opener', 'baseline', 'development'],
    events: [
      {
        id: 'e8',
        timestamp: 600,
        type: 'goal',
        player: 'David Chen',
        description: 'First goal of season',
        quarter: 1,
      },
    ],
    views: 67,
    isAnalyzed: true,
  },
];

const gameTypes = [
  'All Types',
  'Regular Season',
  'Playoff',
  'Scrimmage',
  'Practice',
];
const sortOptions = [
  'Recent Upload',
  'Game Date',
  'Most Viewed',
  'Title A-Z',
  'Duration',
];

function FilmLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameType, setSelectedGameType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Recent Upload');
  const [showAnalyzedOnly, setShowAnalyzedOnly] = useState(false);

  const filteredFilms = mockFilms
    .filter((film) => {
      const matchesSearch =
        film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        film.opponent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        film.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesType =
        selectedGameType === 'All Types' || film.gameType === selectedGameType;
      const matchesAnalyzed = !showAnalyzedOnly || film.isAnalyzed;

      return matchesSearch && matchesType && matchesAnalyzed;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'Recent Upload':
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        case 'Game Date':
          return (
            new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
          );
        case 'Most Viewed':
          return b.views - a.views;
        case 'Title A-Z':
          return a.title.localeCompare(b.title);
        case 'Duration':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getGameTypeColor = (type: string) => {
    switch (type) {
      case 'Playoff':
        return 'bg-red-100 text-red-800';
      case 'Regular Season':
        return 'bg-blue-100 text-blue-800';
      case 'Scrimmage':
        return 'bg-green-100 text-green-800';
      case 'Practice':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalDuration = mockFilms.reduce((sum, film) => sum + film.duration, 0);
  const analyzedCount = mockFilms.filter((film) => film.isAnalyzed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Game Film Library</h1>
          <p className="text-muted-foreground">
            Manage and analyze game footage with timestamped events
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Film
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Total Films</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{mockFilms.length}</div>
            <p className="text-muted-foreground text-xs">
              {formatDuration(totalDuration)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{analyzedCount}</div>
            <p className="text-muted-foreground text-xs">
              {Math.round((analyzedCount / mockFilms.length) * 100)}% complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {mockFilms.reduce((sum, film) => sum + film.views, 0)}
            </div>
            <p className="text-muted-foreground text-xs">Across all films</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-sm">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">10.6 GB</div>
            <p className="text-muted-foreground text-xs">~2.1 GB average</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-64 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search films, opponents, tags..."
              value={searchQuery}
            />
          </div>
          <select
            className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => setSelectedGameType(e.target.value)}
            value={selectedGameType}
          >
            {gameTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={showAnalyzedOnly}
              className="rounded"
              onChange={(e) => setShowAnalyzedOnly(e.target.checked)}
              type="checkbox"
            />
            Analyzed only
          </label>
        </div>

        <select
          className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(e) => setSortBy(e.target.value)}
          value={sortBy}
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFilms.map((film) => (
          <Card
            className="overflow-hidden transition-shadow hover:shadow-lg"
            key={film.id}
          >
            <div className="relative">
              <div className="flex aspect-video items-center justify-center bg-muted">
                <FileVideo className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="absolute top-2 left-2">
                <Badge className={getGameTypeColor(film.gameType)}>
                  {film.gameType}
                </Badge>
              </div>
              <div className="absolute top-2 right-2">
                {film.isAnalyzed && (
                  <Badge className="text-xs" variant="secondary">
                    Analyzed
                  </Badge>
                )}
              </div>
              <div className="absolute right-2 bottom-2">
                <Badge
                  className="border-white/20 bg-black/50 text-white text-xs"
                  variant="outline"
                >
                  {formatDuration(film.duration)}
                </Badge>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                <Button size="sm" variant="secondary">
                  <Play className="mr-2 h-4 w-4" />
                  Watch
                </Button>
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight">
                    {film.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {formatDate(film.gameDate)} • vs {film.opponent}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="line-clamp-2 text-muted-foreground text-sm">
                {film.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {film.tags.slice(0, 3).map((tag) => (
                  <Badge className="text-xs" key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                {film.tags.length > 3 && (
                  <Badge className="text-xs" variant="outline">
                    +{film.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-muted-foreground text-sm">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{film.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(film.uploadDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{film.uploadedBy}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileVideo className="h-3 w-3" />
                  <span>{film.fileSize}</span>
                </div>
              </div>

              {film.events.length > 0 && (
                <div className="border-t pt-2">
                  <p className="mb-2 font-medium text-muted-foreground text-xs">
                    {film.events.length} events tagged
                  </p>
                  <div className="flex gap-1">
                    {film.events.slice(0, 3).map((event) => (
                      <Badge
                        className="text-xs"
                        key={event.id}
                        variant="outline"
                      >
                        {event.type}
                      </Badge>
                    ))}
                    {film.events.length > 3 && (
                      <Badge className="text-xs" variant="outline">
                        +{film.events.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" size="sm">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFilms.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <FileVideo className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold text-lg">No films found</h3>
          <p className="mb-4 text-muted-foreground">
            Try adjusting your search criteria or upload new game footage.
          </p>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Film
          </Button>
        </div>
      )}
    </div>
  );
}
