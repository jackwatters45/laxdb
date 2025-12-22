import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Globe, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock server function for creating opposing teams
const createOpposingTeam = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateOpposingTeamInput) => data)
  .handler(async ({ data }) => {
    // TODO: Replace with actual API call
    // const { ScoutingAPI } = await import('@laxdb/core/scouting/index');
    // const request = getRequest();
    // return await ScoutingAPI.createOpposingTeam(data, request.headers);

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      wins: 0,
      losses: 0,
      ties: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      reportsCount: 0,
      lastScoutedDate: null,
    };
  });

type CreateOpposingTeamInput = {
  name: string;
  leagueName?: string;
  division?: string;
  coachName?: string;
  assistantCoaches?: string[];
  homeField?: string;
  teamColors?: string;
  mascot?: string;
  coachEmail?: string;
  coachPhone?: string;
  teamWebsite?: string;
  typicalStyle?: 'aggressive' | 'fast_break' | 'possession' | 'defensive';
  strengths?: string[];
  weaknesses?: string[];
  keyPlayers?: string[];
  notes?: string;
};

export const Route = createFileRoute(
  '/_protected/$organizationSlug/scouting/teams/create'
)({
  component: CreateOpposingTeamPage,
});

function CreateOpposingTeamPage() {
  const { organizationSlug } = Route.useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<CreateOpposingTeamInput>({
    name: '',
    leagueName: '',
    division: '',
    coachName: '',
    assistantCoaches: [],
    homeField: '',
    teamColors: '',
    mascot: '',
    coachEmail: '',
    coachPhone: '',
    teamWebsite: '',
    typicalStyle: 'aggressive',
    strengths: [],
    weaknesses: [],
    keyPlayers: [],
    notes: '',
  });

  // Text input states for array fields
  const [strengthsText, setStrengthsText] = useState('');
  const [weaknessesText, setWeaknessesText] = useState('');
  const [keyPlayersText, setKeyPlayersText] = useState('');
  const [assistantCoachesText, setAssistantCoachesText] = useState('');

  const createTeamMutation = useMutation({
    mutationKey: ['createOpposingTeam'],
    mutationFn: (data: CreateOpposingTeamInput) => createOpposingTeam({ data }),
    onSuccess: (team) => {
      toast.success(`${team.name} added successfully!`);
      router.invalidate();
      router.navigate({
        to: '/$organizationSlug/scouting/teams',
        params: { organizationSlug },
      });
    },
    onError: (_error) => {
      toast.error('Failed to create team. Please try again.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Team name is required.');
      return;
    }

    // Convert text inputs to arrays
    const finalData = {
      ...formData,
      strengths: strengthsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      weaknesses: weaknessesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      keyPlayers: keyPlayersText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      assistantCoaches: assistantCoachesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    createTeamMutation.mutate(finalData);
  };

  const handleInputChange = (
    field: keyof CreateOpposingTeamInput,
    value: string | undefined
  ) => {
    if (value !== undefined) {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <Link
          params={{ organizationSlug }}
          to="/$organizationSlug/scouting/teams"
        >
          <Button className="mb-4" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opposing Teams
          </Button>
        </Link>

        <h1 className="font-bold text-3xl">Add Opposing Team</h1>
        <p className="text-muted-foreground">
          Create a new opposing team profile for scouting
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="name"
                >
                  Team Name *
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="name"
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Riverside Hawks, Central Valley Eagles"
                  required
                  type="text"
                  value={formData.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="leagueName"
                  >
                    League
                  </label>
                  <input
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    id="leagueName"
                    onChange={(e) =>
                      handleInputChange('leagueName', e.target.value)
                    }
                    placeholder="Metro Lacrosse League"
                    type="text"
                    value={formData.leagueName}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="division"
                  >
                    Division
                  </label>
                  <input
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    id="division"
                    onChange={(e) =>
                      handleInputChange('division', e.target.value)
                    }
                    placeholder="Division A"
                    type="text"
                    value={formData.division}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="teamColors"
                  >
                    Team Colors
                  </label>
                  <input
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    id="teamColors"
                    onChange={(e) =>
                      handleInputChange('teamColors', e.target.value)
                    }
                    placeholder="Blue and Gold"
                    type="text"
                    value={formData.teamColors}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="mascot"
                  >
                    Mascot
                  </label>
                  <input
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    id="mascot"
                    onChange={(e) =>
                      handleInputChange('mascot', e.target.value)
                    }
                    placeholder="Hawks"
                    type="text"
                    value={formData.mascot}
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="homeField"
                >
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Home Field
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="homeField"
                  onChange={(e) =>
                    handleInputChange('homeField', e.target.value)
                  }
                  placeholder="Memorial Stadium, Sports Complex"
                  type="text"
                  value={formData.homeField}
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="typicalStyle"
                >
                  Playing Style
                </label>
                <select
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="typicalStyle"
                  onChange={(e) =>
                    handleInputChange(
                      'typicalStyle',
                      e.target.value as CreateOpposingTeamInput['typicalStyle']
                    )
                  }
                  value={formData.typicalStyle}
                >
                  <option value="aggressive">Aggressive</option>
                  <option value="fast_break">Fast Break</option>
                  <option value="possession">Possession</option>
                  <option value="defensive">Defensive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="coachName"
                >
                  Head Coach
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="coachName"
                  onChange={(e) =>
                    handleInputChange('coachName', e.target.value)
                  }
                  placeholder="John Smith"
                  type="text"
                  value={formData.coachName}
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="assistantCoaches"
                >
                  Assistant Coaches
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="assistantCoaches"
                  onChange={(e) => setAssistantCoachesText(e.target.value)}
                  placeholder="Mike Johnson, Sarah Wilson (comma separated)"
                  type="text"
                  value={assistantCoachesText}
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  Separate multiple coaches with commas
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="coachEmail"
                >
                  <Mail className="mr-1 inline h-4 w-4" />
                  Coach Email
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="coachEmail"
                  onChange={(e) =>
                    handleInputChange('coachEmail', e.target.value)
                  }
                  placeholder="coach@team.com"
                  type="email"
                  value={formData.coachEmail}
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="coachPhone"
                >
                  <Phone className="mr-1 inline h-4 w-4" />
                  Coach Phone
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="coachPhone"
                  onChange={(e) =>
                    handleInputChange('coachPhone', e.target.value)
                  }
                  placeholder="(555) 123-4567"
                  type="tel"
                  value={formData.coachPhone}
                />
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="teamWebsite"
                >
                  <Globe className="mr-1 inline h-4 w-4" />
                  Team Website
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="teamWebsite"
                  onChange={(e) =>
                    handleInputChange('teamWebsite', e.target.value)
                  }
                  placeholder="https://team-website.com"
                  type="url"
                  value={formData.teamWebsite}
                />
              </div>
            </CardContent>
          </Card>

          {/* Strategic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Strategic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="strengths"
                  >
                    Team Strengths
                  </label>
                  <input
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    id="strengths"
                    onChange={(e) => setStrengthsText(e.target.value)}
                    placeholder="Fast Break, Strong Defense, Experienced Players"
                    type="text"
                    value={strengthsText}
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Separate multiple strengths with commas
                  </p>
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-sm"
                    htmlFor="weaknesses"
                  >
                    Team Weaknesses
                  </label>
                  <input
                    className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    id="weaknesses"
                    onChange={(e) => setWeaknessesText(e.target.value)}
                    placeholder="Poor Face-offs, Weak Left Side, Penalties"
                    type="text"
                    value={weaknessesText}
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Separate multiple weaknesses with commas
                  </p>
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="keyPlayers"
                >
                  Key Players
                </label>
                <input
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="keyPlayers"
                  onChange={(e) => setKeyPlayersText(e.target.value)}
                  placeholder="#23 Johnson (Attack), #1 Smith (Goalie), #15 Davis (Midfield)"
                  type="text"
                  value={keyPlayersText}
                />
                <p className="mt-1 text-muted-foreground text-xs">
                  Include jersey numbers and positions, separate with commas
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block font-medium text-sm"
                  htmlFor="notes"
                >
                  Additional Notes
                </label>
                <textarea
                  className="w-full rounded-md border border-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  id="notes"
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information about this team..."
                  rows={3}
                  value={formData.notes}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="mt-6 flex gap-4">
          <Button asChild className="flex-1" variant="outline">
            <Link
              params={{ organizationSlug }}
              to="/$organizationSlug/scouting/teams"
            >
              Cancel
            </Link>
          </Button>
          <Button
            className="flex-1"
            disabled={createTeamMutation.isPending}
            type="submit"
          >
            {createTeamMutation.isPending ? 'Creating Team...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </div>
  );
}
