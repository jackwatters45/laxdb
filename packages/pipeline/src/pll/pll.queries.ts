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
