export const PLAYERS_QUERY = `
query($season: Int, $includeZPP: Boolean!, $includeReg: Boolean!, $includePost: Boolean!, $limit: Int, $league: String) {
  allPlayers(season: $season, includeZPP: $includeZPP, limit: $limit, league: $league) {
    officialId
    collegeYear
    country
    countryCode
    firstName
    lastName
    lastNameSuffix
    handedness
    injuryDescription
    injuryStatus
    isCaptain
    profileUrl
    experience
    expFromYear
    allYears
    slug
    jerseyNum
    allTeams {
      officialId
      location
      locationCode
      urlLogo
      league
      position
      positionName
      jerseyNum
      year
      fullName
    }
    stats(year: $season, segment: regular) @include(if: $includeReg) {
      points
      scoringPoints
      faceoffPct
      shots
      shotPct
      shotsOnGoal
      shotsOnGoalPct
      twoPointShots
      twoPointShotPct
      twoPointShotsOnGoal
      twoPointShotsOnGoalPct
      savePct
      onePointGoals
      scoresAgainst
      saa
      gamesPlayed
      goals
      twoPointGoals
      assists
      groundBalls
      turnovers
      causedTurnovers
      faceoffsWon
      faceoffsLost
      faceoffs
      goalsAgainst
      twoPointGoalsAgainst
      numPenalties
      pim
      pimValue
      saves
      powerPlayGoals
      powerPlayShots
      shortHandedGoals
      shortHandedShots
      shortHandedGoalsAgainst
      powerPlayGoalsAgainst
      tof
      goalieWins
      goalieLosses
      goalieTies
      GAA
      twoPtGaa
      plusMinus
      foRecord
      shotTurnovers
      touches
      totalPasses
      unassistedGoals
      assistedGoals
      passRate
      shotRate
      goalRate
      assistRate
      turnoverRate
    }
    postStats: stats(year: $season, segment: post) @include(if: $includePost) {
      points
      scoringPoints
      faceoffPct
      shots
      shotPct
      shotsOnGoal
      shotsOnGoalPct
      twoPointShots
      twoPointShotPct
      twoPointShotsOnGoal
      twoPointShotsOnGoalPct
      savePct
      onePointGoals
      scoresAgainst
      saa
      gamesPlayed
      goals
      twoPointGoals
      assists
      groundBalls
      turnovers
      causedTurnovers
      faceoffsWon
      faceoffsLost
      faceoffs
      goalsAgainst
      twoPointGoalsAgainst
      numPenalties
      pim
      pimValue
      saves
      powerPlayGoals
      powerPlayShots
      shortHandedGoals
      shortHandedShots
      shortHandedGoalsAgainst
      powerPlayGoalsAgainst
      tof
      goalieWins
      goalieLosses
      goalieTies
      GAA
      twoPtGaa
      plusMinus
      foRecord
      shotTurnovers
      touches
      totalPasses
      unassistedGoals
      assistedGoals
      passRate
      shotRate
      goalRate
      assistRate
      turnoverRate
    }
    champSeries(year: $season) @include(if: $includeZPP) {
      position
      positionName
      team {
        officialId
        locationCode
        location
        position
        positionName
      }
      stats {
        GAA
        assists
        causedTurnovers
        faceoffPct
        faceoffs
        faceoffsLost
        faceoffsWon
        foRecord
        gamesPlayed
        goalieLosses
        goalieTies
        goalieWins
        goals
        goalsAgainst
        groundBalls
        numPenalties
        onePointGoals
        scoringPoints
        pim
        pimValue
        plusMinus
        points
        powerPlayGoals
        powerPlayGoalsAgainst
        powerPlayShots
        saa
        savePct
        saves
        scoresAgainst
        shortHandedGoals
        shortHandedGoalsAgainst
        shortHandedShots
        shotPct
        shots
        shotsOnGoal
        shotsOnGoalPct
        tof
        turnovers
        twoPointGoals
        twoPointGoalsAgainst
        twoPointShots
        twoPointShotPct
        twoPointShotsOnGoal
        twoPointShotsOnGoalPct
        twoPtGaa
        touches
        totalPasses
      }
    }
  }
}
`;

export const STAT_LEADERS_QUERY = `
query($year: Int!, $seasonSegment: SeasonSegment, $statList: [String], $limit: Int) {
  playerStatLeaders(year: $year, seasonSegment: $seasonSegment, statList: $statList, limit: $limit) {
    officialId
    profileUrl
    firstName
    lastName
    position
    statType
    slug
    statValue
    playerRank
    jerseyNum
    teamId
    year
  }
}
`;

const TEAM_STATS_FRAGMENT = `
fragment FullTeamStatsFragment on TeamStatsType {
  scores
  faceoffPct
  shotPct
  twoPointShotPct
  twoPointShotsOnGoalPct
  clearPct
  ridesPct
  savePct
  shortHandedPct
  shortHandedGoalsAgainstPct
  powerPlayGoalsAgainstPct
  manDownPct
  shotsOnGoalPct
  onePointGoals
  scoresAgainst
  saa
  powerPlayPct
  gamesPlayed
  goals
  twoPointGoals
  assists
  groundBalls
  turnovers
  causedTurnovers
  faceoffsWon
  faceoffsLost
  faceoffs
  shots
  twoPointShots
  twoPointShotsOnGoal
  goalsAgainst
  twoPointGoalsAgainst
  numPenalties
  pim
  clears
  clearAttempts
  rides
  rideAttempts
  saves
  offsides
  shotClockExpirations
  powerPlayGoals
  powerPlayShots
  shortHandedGoals
  shortHandedShots
  shortHandedShotsAgainst
  shortHandedGoalsAgainst
  powerPlayGoalsAgainst
  powerPlayShotsAgainst
  timesManUp
  timesShortHanded
  shotsOnGoal
  scoresPG
  shotsPG
  totalPasses
  touches
}
`;

export const TEAMS_QUERY = `
query($year: Int!, $sortBy: String, $includeChampSeries: Boolean!) {
  allTeams(year: $year, sortBy: $sortBy) {
    officialId
    locationCode
    location
    fullName
    urlLogo
    slogan
    teamWins
    teamLosses
    teamTies
    teamWinsPost
    teamLossesPost
    teamTiesPost
    league
    coaches {
      name
      coachType
    }
    stats(year: $year, segment: regular) {
      ...FullTeamStatsFragment
    }
    postStats: stats(year: $year, segment: post) {
      ...FullTeamStatsFragment
    }
    champSeries(year: $year) @include(if: $includeChampSeries) {
      teamWins
      teamLosses
      teamTies
      stats {
        ...FullTeamStatsFragment
      }
    }
  }
}
${TEAM_STATS_FRAGMENT}
`;

export const STANDINGS_QUERY = `
query($year: Int!, $champSeries: Boolean!) {
  standings(season: $year, champSeries: $champSeries) {
    team {
      officialId
      location
      locationCode
      urlLogo
      fullName
    }
    seed
    wins @skip(if: $champSeries)
    losses @skip(if: $champSeries)
    ties @skip(if: $champSeries)
    scores @skip(if: $champSeries)
    scoresAgainst @skip(if: $champSeries)
    scoreDiff @skip(if: $champSeries)
    csWins @include(if: $champSeries)
    csLosses @include(if: $champSeries)
    csTies @include(if: $champSeries)
    csScores @include(if: $champSeries)
    csScoresAgainst @include(if: $champSeries)
    csScoreDiff @include(if: $champSeries)
    conferenceWins
    conferenceLosses
    conferenceTies
    conferenceScores
    conferenceScoresAgainst
    conference
    conferenceSeed
  }
}
`;

export const ADVANCED_PLAYERS_QUERY = `
query($year: Int, $limit: Int, $league: String) {
  allPlayers(season: $year, limit: $limit, includeZPP: false, league: $league) {
    officialId
    firstName
    lastName
    slug
    currentTeam {
      jerseyNum
      position
      officialId
      locationCode
      location
      fullName
      urlLogo
    }
    stats(year: $year, segment: regular) {
      gamesPlayed
      goals
      assists
      shots
      touches
      totalPasses
      turnovers
      passRate
      shotRate
      goalRate
      assistRate
      turnoverRate
    }
    advancedSeasonStats {
      unassistedGoals
      assistedGoals
      settledGoals
      fastbreakGoals
      substitutionGoals
      doorstepGoals
      powerPlayGoals

      assistOpportunities
      settledAssists
      powerPlayAssists
      fastbreakAssists
      dodgeAssists
      pnrAssists

      unassistedShots
      unassistedShotPct
      assistedShots
      assistedShotPct
      pipeShots

      lhShots
      lhGoals
      lhShotPct
      rhShots
      rhGoals
      rhShotPct
    }
  }
}
`;

export const CAREER_STATS_QUERY = `
query($stat: String, $limit: Int) {
  careerStats(stat: $stat, limit: $limit) {
    player {
      name
      experience
      allYears
      slug
    }
    gamesPlayed
    points
    goals
    onePointGoals
    twoPointGoals
    assists
    groundBalls
    saves
    faceoffsWon
  }
}
`;

const FULL_PLAYER_STATS_FRAGMENT = `
fragment FullPlayerStatsFragment on PlayerStats {
  gamesPlayed
  goals
  twoPointGoals
  assists
  points
  scoringPoints
  shots
  shotPct
  shotsOnGoal
  shotsOnGoalPct
  twoPointShots
  twoPointShotPct
  groundBalls
  turnovers
  causedTurnovers
  faceoffsWon
  faceoffsLost
  faceoffs
  faceoffPct
  saves
  savePct
  goalsAgainst
  GAA
  plusMinus
}
`;

const PLAYER_CAREER_STATS_FRAGMENT = `
fragment PlayerCareerStatsFragment on PlayerCareerStats {
  gamesPlayed
  goals
  assists
  points
  turnovers
  shots
  shotPct
  shotsOnGoal
  shotsOnGoalPct
  gamesStarted
  onePointGoals
  twoPointGoals
  saves
  savePct
  scoresAgainst
  foRecord
  faceoffs
  faceoffsWon
  faceoffPct
  causedTurnovers
  groundBalls
  powerPlayGoals
  pimValue
  numPenalties
  twoPointGoalsAgainst
}
`;

const ADVANCED_STATS_FRAGMENT = `
fragment FullPlayerAdvancedStatsFragment on AdvancedSeasonStats {
  unassistedGoals
  assistedGoals
  settledGoals
  fastbreakGoals
  substitutionGoals
  doorstepGoals
  powerPlayGoals
  assistOpportunities
  settledAssists
  powerPlayAssists
  fastbreakAssists
  dodgeAssists
  pnrAssists
  unassistedShots
  unassistedShotPct
  assistedShots
  assistedShotPct
  pipeShots
  lhShots
  lhGoals
  lhShotPct
  rhShots
  rhGoals
  rhShotPct
}
`;

export const PLAYER_DETAIL_QUERY = `
query($slug: ID!, $year: Int, $statsYear: Int) {
  player(slug: $slug, forYear: $year) {
    officialId
    stats(year: $statsYear, segment: regular) {
      ...FullPlayerStatsFragment
    }
    postStats: stats(year: $statsYear, segment: post) {
      ...FullPlayerStatsFragment
    }
    careerStats {
      ...PlayerCareerStatsFragment
    }
    allSeasonStats {
      year
      seasonSegment
      teamId
      gamesPlayed
      goals
      twoPointGoals
      assists
      points
      scoringPoints
      shots
      shotPct
      shotsOnGoal
      shotsOnGoalPct
      twoPointShots
      twoPointShotPct
      groundBalls
      turnovers
      causedTurnovers
      faceoffsWon
      faceoffsLost
      faceoffs
      faceoffPct
      saves
      savePct
      goalsAgainst
      GAA
      plusMinus
    }
    accolades {
      awardName
      years
    }
    champSeries(year: $statsYear) {
      position
      positionName
      team {
        officialId
        locationCode
        location
        position
        positionName
      }
      stats {
        ...FullPlayerStatsFragment
      }
    }
    advancedSeasonStats {
      ...FullPlayerAdvancedStatsFragment
    }
  }
}
${FULL_PLAYER_STATS_FRAGMENT}
${PLAYER_CAREER_STATS_FRAGMENT}
${ADVANCED_STATS_FRAGMENT}
`;

export const TEAM_DETAIL_QUERY = `
query($id: ID!, $year: Int, $statsYear: Int, $eventsYear: Int, $includeChampSeries: Boolean!) {
  team(id: $id, forYear: $year) {
    officialId
    urlLogo
    location
    locationCode
    fullName
    league
    slogan
    teamWins
    teamLosses
    teamTies
    teamWinsPost
    teamLossesPost
    teamTiesPost
    allYears
    coaches {
      officialId
      coachType
      firstName
      lastName
    }
    events(year: $eventsYear) {
      id
      slugname
      externalId
      startTime
      week
      venue
      description
      location
      broadcaster
      eventStatus
    }
    stats(year: $statsYear, segment: regular) {
      ...FullTeamStatsFragment
    }
    postStats: stats(year: $statsYear, segment: post) {
      ...FullTeamStatsFragment
    }
    champSeries(year: $statsYear) @include(if: $includeChampSeries) {
      teamWins
      teamLosses
      teamTies
      stats {
        ...FullTeamStatsFragment
      }
    }
  }
}
${TEAM_STATS_FRAGMENT}
`;

export const TEAM_STATS_ONLY_QUERY = `
query($id: ID, $year:Int, $segment: StatSegment!) {
  team(id: $id, forYear:$year) {
    stats(segment:$segment){
      ...FullTeamStatsFragment
    }
  }
}
${TEAM_STATS_FRAGMENT}
`;

export const EVENT_DETAIL_QUERY = `
query($slug: ID!) {
  event(slug: $slug) {
    id
    homeTeam {
      officialId
      fullName
      location
      locationCode
      urlLogo
    }
    awayTeam {
      officialId
      fullName
      location
      locationCode
      urlLogo
    }
    homeScore
    visitorScore
    eventStatus
    period
    playLogs {
      id
      period
      minutes
      seconds
      teamId
      gbPlayerName
      description
    }
  }
}
`;
