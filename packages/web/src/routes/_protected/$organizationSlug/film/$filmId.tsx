import { effectTsResolver } from '@hookform/resolvers/effect-ts';
import { createFileRoute } from '@tanstack/react-router';
import { Schema } from 'effect';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Download,
  Edit,
  Maximize,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Settings,
  Share,
  SkipBack,
  SkipForward,
  Tag,
  Target,
  Trash2,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

export const Route = createFileRoute(
  '/_protected/$organizationSlug/film/$filmId'
)({
  component: FilmViewerPage,
});

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
    | 'highlight'
    | 'note';
  player?: string | undefined;
  description: string;
  quarter: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
};

type FilmData = {
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
  videoUrl: string;
  description: string;
  tags: string[];
  events: FilmEvent[];
  views: number;
};

const mockFilm: FilmData = {
  id: '1',
  title: 'vs Eagles - Championship Game',
  gameDate: '2024-03-22',
  opponent: 'Central Eagles',
  gameType: 'Playoff',
  duration: 3600,
  uploadDate: '2024-03-23',
  uploadedBy: 'Coach Johnson',
  fileSize: '2.4 GB',
  resolution: '1080p',
  format: 'MP4',
  videoUrl: '/api/placeholder/video',
  description:
    'Championship game footage with complete game coverage. Excellent defensive play in 2nd half.',
  tags: ['championship', 'defense', 'playoff'],
  views: 87,
  events: [
    {
      id: 'e1',
      timestamp: 300,
      type: 'goal',
      player: 'Jake Smith',
      description: 'First goal of the game - great individual effort',
      quarter: 1,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:30:00Z',
      tags: ['individual-effort', 'fast-break'],
    },
    {
      id: 'e2',
      timestamp: 850,
      type: 'save',
      player: 'Mike Wilson',
      description: 'Outstanding save on 1v1 opportunity',
      quarter: 1,
      createdBy: 'Assistant Coach Brown',
      createdAt: '2024-03-23T10:32:00Z',
      tags: ['clutch', 'one-on-one'],
    },
    {
      id: 'e3',
      timestamp: 1200,
      type: 'penalty',
      player: 'Tom Davis',
      description: 'Slashing penalty - unnecessary contact',
      quarter: 2,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:35:00Z',
      tags: ['discipline', 'unnecessary'],
    },
    {
      id: 'e4',
      timestamp: 1800,
      type: 'timeout',
      description: 'Strategic timeout before crucial face-off',
      quarter: 2,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:40:00Z',
      tags: ['strategy', 'momentum'],
    },
    {
      id: 'e5',
      timestamp: 2400,
      type: 'highlight',
      player: 'Alex Johnson',
      description: 'Amazing behind-the-back assist',
      quarter: 3,
      createdBy: 'Manager Steve',
      createdAt: '2024-03-23T10:45:00Z',
      tags: ['highlight-reel', 'creativity'],
    },
    {
      id: 'e6',
      timestamp: 3000,
      type: 'note',
      description: 'Defense starts to tighten up - notice the communication',
      quarter: 3,
      createdBy: 'Coach Johnson',
      createdAt: '2024-03-23T10:50:00Z',
      tags: ['defense', 'communication'],
    },
    {
      id: 'e7',
      timestamp: 3300,
      type: 'substitution',
      player: 'Ryan Lee',
      description: 'Fresh legs for final push',
      quarter: 4,
      createdBy: 'Assistant Coach Brown',
      createdAt: '2024-03-23T10:55:00Z',
      tags: ['fresh-legs', 'strategy'],
    },
  ],
};

// Event form schema
const eventFormSchema = Schema.Struct({
  type: Schema.Literal(
    'goal',
    'assist',
    'save',
    'penalty',
    'substitution',
    'timeout',
    'highlight',
    'note'
  ),
  player: Schema.optional(Schema.String),
  description: Schema.String.pipe(
    Schema.minLength(1, { message: () => 'Description is required' })
  ),
  tags: Schema.optional(Schema.String),
});

type EventFormValues = typeof eventFormSchema.Type;

function FilmViewerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showEventForm, setShowEventForm] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  const eventForm = useForm<EventFormValues>({
    resolver: effectTsResolver(eventFormSchema),
    defaultValues: {
      type: 'note',
      player: '',
      description: '',
      tags: '',
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const film = mockFilm;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuarter = (timestamp: number) => {
    const quarterLength = film.duration / 4;
    return Math.ceil(timestamp / quarterLength);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const skipBackward = () => {
    seekTo(Math.max(0, currentTime - 10));
  };

  const skipForward = () => {
    seekTo(Math.min(film.duration, currentTime + 10));
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const addEvent = (values: EventFormValues) => {
    const _newEvent: FilmEvent = {
      id: `e${Date.now()}`,
      timestamp: currentTime,
      type: values.type,
      player: values.player || undefined,
      description: values.description,
      quarter: getQuarter(currentTime),
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      tags: values.tags
        ? values.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    };

    // Reset form
    eventForm.reset();
    setShowEventForm(false);
  };

  const getEventTypeColor = (type: FilmEvent['type']) => {
    switch (type) {
      case 'goal':
        return 'bg-green-100 text-green-800';
      case 'assist':
        return 'bg-blue-100 text-blue-800';
      case 'save':
        return 'bg-orange-100 text-orange-800';
      case 'penalty':
        return 'bg-red-100 text-red-800';
      case 'substitution':
        return 'bg-purple-100 text-purple-800';
      case 'timeout':
        return 'bg-yellow-100 text-yellow-800';
      case 'highlight':
        return 'bg-pink-100 text-pink-800';
      case 'note':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: FilmEvent['type']) => {
    switch (type) {
      case 'goal':
        return <Target className="h-3 w-3" />;
      case 'assist':
        return <Users className="h-3 w-3" />;
      case 'save':
        return <Target className="h-3 w-3" />;
      case 'penalty':
        return <Tag className="h-3 w-3" />;
      case 'substitution':
        return <Users className="h-3 w-3" />;
      case 'timeout':
        return <Clock className="h-3 w-3" />;
      case 'highlight':
        return <Bookmark className="h-3 w-3" />;
      case 'note':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  // Simulate video progress
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, film.duration));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, film.duration]);

  const progressPercentage = (currentTime / film.duration) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button size="sm" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-2xl">{film.title}</h1>
          <p className="text-muted-foreground">
            {new Date(film.gameDate).toLocaleDateString()} • vs {film.opponent}{' '}
            • {film.gameType}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button size="sm" variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-black">
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Play className="mx-auto mb-4 h-16 w-16" />
                    <p className="text-lg">Video Player Placeholder</p>
                    <p className="text-sm opacity-75">
                      Click controls below to simulate playback
                    </p>
                  </div>
                </div>

                {/* Timeline with events */}
                <div className="absolute right-0 bottom-0 left-0 p-4">
                  <div className="relative">
                    <div
                      aria-label="Video progress"
                      aria-valuemax={film.duration}
                      aria-valuemin={0}
                      aria-valuenow={currentTime}
                      className="h-2 w-full cursor-pointer rounded bg-black/50"
                      onClick={(e) => {
                        if (progressRef.current) {
                          const rect =
                            progressRef.current.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          seekTo(percent * film.duration);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft') {
                          seekTo(Math.max(0, currentTime - 10));
                        } else if (e.key === 'ArrowRight') {
                          seekTo(Math.min(film.duration, currentTime + 10));
                        }
                      }}
                      ref={progressRef}
                      role="slider"
                      tabIndex={0}
                    >
                      <div
                        className="h-full rounded bg-red-500"
                        style={{ width: `${progressPercentage}%` }}
                      />

                      {/* Event markers */}
                      {film.events.map((event) => (
                        <button
                          aria-label={`Jump to ${event.type} at ${formatTime(event.timestamp)}`}
                          className="-translate-x-0.5 absolute top-0 h-full w-1 transform cursor-pointer"
                          key={event.id}
                          onClick={() => seekTo(event.timestamp)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              seekTo(event.timestamp);
                            }
                          }}
                          onMouseEnter={() => setHoveredEvent(event.id)}
                          onMouseLeave={() => setHoveredEvent(null)}
                          style={{
                            left: `${(event.timestamp / film.duration) * 100}%`,
                          }}
                          tabIndex={0}
                          type="button"
                        >
                          <div
                            className={`h-full w-1 ${getEventTypeColor(event.type).includes('green') ? 'bg-green-400' : getEventTypeColor(event.type).includes('blue') ? 'bg-blue-400' : getEventTypeColor(event.type).includes('red') ? 'bg-red-400' : getEventTypeColor(event.type).includes('orange') ? 'bg-orange-400' : getEventTypeColor(event.type).includes('purple') ? 'bg-purple-400' : getEventTypeColor(event.type).includes('yellow') ? 'bg-yellow-400' : getEventTypeColor(event.type).includes('pink') ? 'bg-pink-400' : 'bg-gray-400'}`}
                          />

                          {hoveredEvent === event.id && (
                            <div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-10 transform whitespace-nowrap rounded bg-black/90 p-2 text-white text-xs">
                              <div className="font-medium">
                                {event.type.charAt(0).toUpperCase() +
                                  event.type.slice(1)}
                              </div>
                              <div>{formatTime(event.timestamp)}</div>
                              {event.player && <div>{event.player}</div>}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      className="text-white hover:bg-white/20"
                      onClick={skipBackward}
                      size="sm"
                      variant="ghost"
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      className="text-white hover:bg-white/20"
                      onClick={togglePlayPause}
                      size="sm"
                      variant="ghost"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      className="text-white hover:bg-white/20"
                      onClick={skipForward}
                      size="sm"
                      variant="ghost"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        className="text-white hover:bg-white/20"
                        onClick={toggleMute}
                        size="sm"
                        variant="ghost"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        className="w-20"
                        max="1"
                        min="0"
                        onChange={(e) =>
                          setVolume(Number.parseFloat(e.target.value))
                        }
                        step="0.1"
                        type="range"
                        value={isMuted ? 0 : volume}
                      />
                    </div>

                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(film.duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="rounded border-0 bg-white/20 px-2 py-1 text-sm text-white"
                      onChange={(e) =>
                        changePlaybackRate(Number.parseFloat(e.target.value))
                      }
                      value={playbackRate}
                    >
                      <option value={0.25}>0.25x</option>
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>

                    <Button
                      className="text-white hover:bg-white/20"
                      size="sm"
                      variant="ghost"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <Button
                      className="text-white hover:bg-white/20"
                      size="sm"
                      variant="ghost"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Event</CardTitle>
                <Button
                  onClick={() => setShowEventForm(!showEventForm)}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            {showEventForm && (
              <CardContent>
                <Form {...eventForm}>
                  <form
                    className="space-y-4"
                    onSubmit={eventForm.handleSubmit(addEvent)}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={eventForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="goal">Goal</SelectItem>
                                <SelectItem value="assist">Assist</SelectItem>
                                <SelectItem value="save">Save</SelectItem>
                                <SelectItem value="penalty">Penalty</SelectItem>
                                <SelectItem value="substitution">
                                  Substitution
                                </SelectItem>
                                <SelectItem value="timeout">Timeout</SelectItem>
                                <SelectItem value="highlight">
                                  Highlight
                                </SelectItem>
                                <SelectItem value="note">Note</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={eventForm.control}
                        name="player"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Player (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Player name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={eventForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Describe what happened..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={eventForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (comma-separated)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="fast-break, clutch, highlight-reel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        disabled={eventForm.formState.isSubmitting}
                        type="submit"
                      >
                        Add Event at {formatTime(currentTime)}
                      </Button>
                      <Button
                        onClick={() => setShowEventForm(false)}
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Events Timeline
              </CardTitle>
              <CardDescription>
                {film.events.length} events • Click to jump to timestamp
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-y-auto">
              {film.events
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((event) => (
                  <button
                    aria-label={`Jump to ${event.type}: ${event.description}`}
                    className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    key={event.id}
                    onClick={() => seekTo(event.timestamp)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        seekTo(event.timestamp);
                      }
                    }}
                    tabIndex={0}
                    type="button"
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <Badge
                        className={`text-xs ${getEventTypeColor(event.type)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getEventIcon(event.type)}
                          {event.type}
                        </span>
                      </Badge>
                      <Badge className="text-xs" variant="outline">
                        Q{event.quarter}
                      </Badge>
                      <Badge className="text-xs" variant="outline">
                        {formatTime(event.timestamp)}
                      </Badge>
                    </div>

                    <p className="mb-1 font-medium text-sm">
                      {event.description}
                    </p>

                    {event.player && (
                      <p className="mb-1 text-muted-foreground text-xs">
                        Player: {event.player}
                      </p>
                    )}

                    {event.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {event.tags.map((tag) => (
                          <Badge
                            className="text-xs"
                            key={tag}
                            variant="secondary"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>by {event.createdBy}</span>
                      <div className="flex gap-1">
                        <Button
                          className="h-6 w-6 p-0"
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          className="h-6 w-6 p-0 text-red-500"
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}

              {film.events.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">No events yet</p>
                  <p className="text-xs">
                    Add events to mark important moments
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Film Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-medium">{formatTime(film.duration)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Resolution:</span>
                  <div className="font-medium">{film.resolution}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>
                  <div className="font-medium">{film.fileSize}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Views:</span>
                  <div className="font-medium">{film.views}</div>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">
                  Uploaded by:
                </span>
                <div className="font-medium">{film.uploadedBy}</div>
                <div className="text-muted-foreground text-xs">
                  {new Date(film.uploadDate).toLocaleDateString()}
                </div>
              </div>

              {film.tags.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Tags:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {film.tags.map((tag) => (
                      <Badge className="text-xs" key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-sm">
                  Description:
                </span>
                <p className="mt-1 text-sm">{film.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
