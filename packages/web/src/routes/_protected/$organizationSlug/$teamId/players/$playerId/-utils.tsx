import { GraduationCap, Star, Target, Trophy } from 'lucide-react';

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

export const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'improving':
      return 'default';
    case 'stable':
      return 'secondary';
    case 'needs_attention':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getTrendLabel = (trend: string) => {
  switch (trend) {
    case 'improving':
      return 'Improving';
    case 'stable':
      return 'Stable';
    case 'needs_attention':
      return 'Needs Attention';
    default:
      return trend;
  }
};

export const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'default';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'not_started':
      return 'outline';
    default:
      return 'outline';
  }
};

export const getGoalCategoryIcon = (category: string) => {
  switch (category) {
    case 'skill':
      return <Target className="h-4 w-4" />;
    case 'academic':
      return <GraduationCap className="h-4 w-4" />;
    case 'team':
      return <Trophy className="h-4 w-4" />;
    default:
      return <Star className="h-4 w-4" />;
  }
};

export const mockPlayerDetails = {
  id: '1',
  userId: 'user-1',
  name: 'Alex Johnson',
  jerseyNumber: 23,
  primaryPosition: 'attack',
  secondaryPositions: ['midfield'],
  gradeLevel: 'junior',
  gpa: 3.7,
  height: '6\'0"',
  weight: '175 lbs',
  dominantHand: 'right',
  academicStanding: 'good',

  // Personal Information
  emergencyContactName: 'Sarah Johnson (Mother)',
  emergencyContactPhone: '(555) 123-4567',
  seasonGoals:
    'Score 25 goals, improve shot accuracy to 75%, become team captain',
  collegeAspirations: 'Division I lacrosse scholarship, study business',
  careerGoals: 'Professional lacrosse player or sports management',

  // Equipment & Medical
  equipmentNeeds: 'New helmet (medium), backup stick',
  medicalNotes: 'Minor shoulder injury (cleared), allergic to ibuprofen',
  injuryHistory: 'Sprained ankle (2023), minor concussion (2022)',

  // Development Summary
  overallRating: 7,
  potentialRating: 9,
  developmentTrend: 'improving' as const,
  priorityLevel: 'high' as const,

  // Season Statistics
  gamesPlayed: 12,
  goals: 18,
  assists: 12,
  shots: 45,
  shotsOnGoal: 28,
  shotAccuracy: 62.2,
  groundBalls: 15,
  turnovers: 8,
  causedTurnovers: 5,
  penalties: 3,
  penaltyMinutes: 6,
  minutesPlayed: 35.2,

  // Recent Development Activity
  recentNotes: [
    {
      id: '1',
      title: 'Excellent leadership in practice',
      type: 'behavior',
      date: new Date('2024-09-20'),
      priority: 'medium' as const,
      coach: 'Coach Johnson',
    },
    {
      id: '2',
      title: 'Shot mechanics improvement',
      type: 'skill_assessment',
      date: new Date('2024-09-18'),
      priority: 'high' as const,
      coach: 'Coach Smith',
    },
    {
      id: '3',
      title: 'Academic check-in',
      type: 'general',
      date: new Date('2024-09-15'),
      priority: 'low' as const,
      coach: 'Coach Johnson',
    },
  ],

  // Active Goals
  activeGoals: [
    {
      id: '1',
      title: 'Improve Shot Accuracy',
      targetValue: '75% accuracy',
      currentValue: '62% accuracy',
      progress: 65,
      dueDate: new Date('2024-11-15'),
      category: 'skill',
    },
    {
      id: '2',
      title: 'Score 25 Goals This Season',
      targetValue: '25 goals',
      currentValue: '18 goals',
      progress: 72,
      dueDate: new Date('2024-11-30'),
      category: 'team',
    },
    {
      id: '3',
      title: 'Maintain 3.7+ GPA',
      targetValue: '3.7 GPA',
      currentValue: '3.7 GPA',
      progress: 100,
      dueDate: new Date('2024-12-15'),
      category: 'academic',
    },
  ],

  // Assigned Resources
  assignedResources: [
    {
      id: '1',
      title: 'Advanced Shooting Drills',
      type: 'drill',
      status: 'in_progress' as const,
      assignedDate: new Date('2024-09-15'),
      dueDate: new Date('2024-09-30'),
      priority: 'high' as const,
    },
    {
      id: '2',
      title: 'Leadership Skills Video Series',
      type: 'video',
      status: 'completed' as const,
      assignedDate: new Date('2024-09-10'),
      dueDate: new Date('2024-09-25'),
      priority: 'medium' as const,
    },
    {
      id: '3',
      title: 'NCAA Recruiting Rules Guide',
      type: 'article',
      status: 'not_started' as const,
      assignedDate: new Date('2024-09-22'),
      dueDate: new Date('2024-10-05'),
      priority: 'medium' as const,
    },
  ],

  // Latest Skills Assessment
  latestAssessment: {
    date: new Date('2024-09-15'),
    assessedBy: 'Coach Johnson',

    // Offensive Skills
    shootingAccuracy: 7,
    shootingPower: 6,
    dodgingAbility: 8,
    passingAccuracy: 8,
    ballHandling: 9,

    // Defensive Skills
    stickChecking: 5,
    bodyPositioning: 6,
    communication: 8,

    // Athletic Skills
    speed: 7,
    agility: 8,
    endurance: 7,
    strength: 6,

    // Mental Skills
    fieldAwareness: 9,
    decisionMaking: 8,
    leadership: 8,
    coachability: 9,

    strengths: 'Excellent field vision, strong ball handling, natural leader',
    areasForImprovement: 'Shot power, defensive positioning, physical strength',
  },

  // Upcoming Events
  nextMeetingDate: new Date('2024-09-25'),
  nextAssessmentDate: new Date('2024-10-15'),
};

export type PlayerDetails = typeof mockPlayerDetails;
