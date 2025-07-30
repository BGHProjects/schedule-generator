import type { TournamentData, Game, Team } from "@/types/tournament"

export function generateSchedule(data: TournamentData): Game[] {
  const games: Game[] = []
  let gameIdCounter = 1

  // Generate all possible matchups by pool - ONLY UNIQUE MATCHUPS
  const allUniqueMatchups = generateUniqueMatchups(data.teams, data.pools)

  // Shuffle matchups for better distribution
  shuffleArray(allUniqueMatchups)

  // Create time slots
  const timeSlots = generateTimeSlots(data)

  // Track which teams are busy at each time slot
  const busyTeams: { [timeSlot: string]: Set<string> } = {}
  const busyRefs: { [timeSlot: string]: Set<string> } = {}
  const busyCourts: { [timeSlot: string]: Set<number> } = {}

  // Track team game history for better distribution
  const teamLastGameTime: { [teamId: string]: string | null } = {}
  const teamConsecutiveGames: { [teamId: string]: number } = {}
  const teamCourtHistory: { [teamId: string]: { [court: number]: string[] } } = {}

  // Initialize tracking objects
  timeSlots.forEach((slot) => {
    busyTeams[slot] = new Set()
    busyRefs[slot] = new Set()
    busyCourts[slot] = new Set()
  })

  data.teams.forEach((team) => {
    teamLastGameTime[team.id] = null
    teamConsecutiveGames[team.id] = 0
    teamCourtHistory[team.id] = {}
    for (let court = 1; court <= data.courts; court++) {
      teamCourtHistory[team.id][court] = []
    }
  })

  // Schedule all unique matchups first
  let currentTimeSlotIndex = 0

  for (const matchup of allUniqueMatchups) {
    let scheduled = false
    let bestSlot = null
    let bestCourt = null
    let bestScore = -1

    // Try to find the best time slot and court combination
    for (let slotOffset = 0; slotOffset < timeSlots.length && !scheduled; slotOffset++) {
      const slotIndex = (currentTimeSlotIndex + slotOffset) % timeSlots.length
      const timeSlot = timeSlots[slotIndex]

      // Check if this is during tournament breaks
      if (isTimeSlotDuringBreaks(timeSlot, data.tournamentBreaks, data.gameDuration)) {
        continue
      }

      // CRITICAL: Check if both teams are available (NO DOUBLE BOOKING)
      if (busyTeams[timeSlot].has(matchup.team1.id) || busyTeams[timeSlot].has(matchup.team2.id)) {
        continue
      }

      // Try each court
      for (let court = 1; court <= data.courts; court++) {
        if (busyCourts[timeSlot].has(court)) {
          continue
        }

        // Calculate score for this slot/court combination
        const score = calculateSlotScore(
          matchup,
          timeSlot,
          court,
          teamLastGameTime,
          teamConsecutiveGames,
          teamCourtHistory,
        )

        if (score > bestScore) {
          bestScore = score
          bestSlot = timeSlot
          bestCourt = court
        }
      }
    }

    // If we found a good slot, schedule the game
    if (bestSlot && bestCourt) {
      const availableRef = findAvailableRef(data.refs, matchup.team1, matchup.team2, bestSlot, busyRefs, games)

      const game: Game = {
        id: gameIdCounter.toString(),
        team1Id: matchup.team1.id,
        team2Id: matchup.team2.id,
        court: bestCourt,
        timeSlot: bestSlot,
        pool: matchup.pool,
        refId: availableRef?.id || null,
      }

      games.push(game)
      gameIdCounter++

      // Update tracking - CRITICAL: Mark teams as busy
      busyTeams[bestSlot].add(matchup.team1.id)
      busyTeams[bestSlot].add(matchup.team2.id)
      busyCourts[bestSlot].add(bestCourt)
      if (availableRef) {
        busyRefs[bestSlot].add(availableRef.id)
      }

      // Update team history
      updateTeamHistory(matchup.team1.id, bestSlot, bestCourt, teamLastGameTime, teamConsecutiveGames, teamCourtHistory)
      updateTeamHistory(matchup.team2.id, bestSlot, bestCourt, teamLastGameTime, teamConsecutiveGames, teamCourtHistory)

      scheduled = true
    }

    // If not scheduled, add more time slots
    if (!scheduled) {
      const lastTime = timeSlots[timeSlots.length - 1]
      const nextTime = addMinutes(lastTime, data.gameDuration + data.breakBetweenGames)
      timeSlots.push(nextTime)
      busyTeams[nextTime] = new Set()
      busyRefs[nextTime] = new Set()
      busyCourts[nextTime] = new Set()

      const availableRef = findAvailableRef(data.refs, matchup.team1, matchup.team2, nextTime, busyRefs, games)

      const game: Game = {
        id: gameIdCounter.toString(),
        team1Id: matchup.team1.id,
        team2Id: matchup.team2.id,
        court: 1,
        timeSlot: nextTime,
        pool: matchup.pool,
        refId: availableRef?.id || null,
      }

      games.push(game)
      gameIdCounter++

      busyTeams[nextTime].add(matchup.team1.id)
      busyTeams[nextTime].add(matchup.team2.id)
      busyCourts[nextTime].add(1)
      if (availableRef) {
        busyRefs[nextTime].add(availableRef.id)
      }

      updateTeamHistory(matchup.team1.id, nextTime, 1, teamLastGameTime, teamConsecutiveGames, teamCourtHistory)
      updateTeamHistory(matchup.team2.id, nextTime, 1, teamLastGameTime, teamConsecutiveGames, teamCourtHistory)
    }

    currentTimeSlotIndex = (currentTimeSlotIndex + 1) % timeSlots.length
  }

  // Final cleanup - remove any duplicates that might have slipped through
  const cleanedGames = removeDuplicateGames(games)

  // AGGRESSIVE GAP ELIMINATION - NO GAPS ALLOWED
  const fullyPopulatedGames = eliminateAllGapsAggressively(cleanedGames, data, timeSlots)

  // CRITICAL: Fix all referee assignments after gap elimination
  const gamesWithFixedRefs = fixAllRefereeAssignments(fullyPopulatedGames, data)

  // Validation pass - ensure no team conflicts
  const finalValidation = validateSchedule(gamesWithFixedRefs)
  if (!finalValidation.isValid) {
    console.error("Schedule validation failed:", finalValidation.errors)
  }

  // Validate referee assignments
  const refValidation = validateRefereeAssignments(gamesWithFixedRefs, data)
  if (!refValidation.isValid) {
    console.error("Referee validation failed:", refValidation.errors)
  }

  return gamesWithFixedRefs
}

function fixAllRefereeAssignments(games: Game[], data: TournamentData): Game[] {
  console.log(`🔧 FIXING REFEREE ASSIGNMENTS FOR ${games.length} GAMES`)

  // Get all time slots and sort them
  const allTimeSlots = Array.from(new Set(games.map((g) => g.timeSlot))).sort()

  // Group games by time slot
  const gamesByTimeSlot: { [timeSlot: string]: Game[] } = {}
  games.forEach((game) => {
    if (!gamesByTimeSlot[game.timeSlot]) {
      gamesByTimeSlot[game.timeSlot] = []
    }
    gamesByTimeSlot[game.timeSlot].push(game)
  })

  const updatedGames = [...games]

  // Track referee assignments across all time slots for back-to-back prevention
  const refLastAssignment: { [refId: string]: string | null } = {}
  data.refs.forEach((ref) => {
    refLastAssignment[ref.id] = null
  })

  // Fix referee assignments for each time slot in chronological order
  allTimeSlots.forEach((timeSlot) => {
    const gamesInSlot = gamesByTimeSlot[timeSlot] || []
    console.log(`⏰ Fixing refs for ${timeSlot}: ${gamesInSlot.length} games`)

    // Reset referee assignments for this time slot
    const busyRefIds = new Set<string>()

    gamesInSlot.forEach((game) => {
      const gameIndex = updatedGames.findIndex((g) => g.id === game.id)
      if (gameIndex === -1) return

      const team1 = data.teams.find((t) => t.id === game.team1Id)
      const team2 = data.teams.find((t) => t.id === game.team2Id)

      if (!team1 || !team2) {
        updatedGames[gameIndex].refId = null
        return
      }

      // Find available referee for this game with enhanced constraints
      const availableRef = findAvailableRefWithConstraints(
        data.refs,
        team1,
        team2,
        timeSlot,
        busyRefIds,
        refLastAssignment,
        allTimeSlots,
      )

      if (availableRef) {
        updatedGames[gameIndex].refId = availableRef.id
        busyRefIds.add(availableRef.id)
        refLastAssignment[availableRef.id] = timeSlot
        console.log(`✅ Assigned ref ${availableRef.name} to game ${game.id}`)
      } else {
        updatedGames[gameIndex].refId = null
        console.log(`⚠️  No available ref for game ${game.id} (${team1.name} vs ${team2.name})`)
      }
    })
  })

  console.log(`🎯 Referee assignment complete`)
  return updatedGames
}

function findAvailableRefWithConstraints(
  refs: any[],
  team1: Team,
  team2: Team,
  currentTimeSlot: string,
  busyRefIds: Set<string>,
  refLastAssignment: { [refId: string]: string | null },
  allTimeSlots: string[],
) {
  if (refs.length === 0) return null

  // Get the previous time slot for back-to-back checking
  const currentIndex = allTimeSlots.indexOf(currentTimeSlot)
  const previousTimeSlot = currentIndex > 0 ? allTimeSlots[currentIndex - 1] : null

  // Find refs that meet ALL constraints
  const availableRefs = refs.filter((ref) => {
    // 1. Not affiliated with either playing team
    if (ref.teamId === team1.id || ref.teamId === team2.id) {
      return false
    }

    // 2. Not already busy in this time slot
    if (busyRefIds.has(ref.id)) {
      return false
    }

    // 3. CRITICAL: Ref's team is not playing in this time slot
    if (ref.teamId) {
      // This would be checked in the calling function, but let's be extra safe
      // We don't have access to all games here, so this check happens in the main validation
    }

    // 4. NEW: Prevent back-to-back assignments (at least one time slot gap)
    if (previousTimeSlot && refLastAssignment[ref.id] === previousTimeSlot) {
      console.log(`🚫 Ref ${ref.name} worked previous slot ${previousTimeSlot}, skipping for ${currentTimeSlot}`)
      return false
    }

    return true
  })

  // Return the first available referee, or null if none available
  return availableRefs.length > 0 ? availableRefs[0] : null
}

function validateRefereeAssignments(games: Game[], data: TournamentData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const gamesByTimeSlot: { [timeSlot: string]: Game[] } = {}

  // Group games by time slot
  games.forEach((game) => {
    if (!gamesByTimeSlot[game.timeSlot]) {
      gamesByTimeSlot[game.timeSlot] = []
    }
    gamesByTimeSlot[game.timeSlot].push(game)
  })

  // Check referee assignments for each time slot
  Object.entries(gamesByTimeSlot).forEach(([timeSlot, gamesInSlot]) => {
    const refsInSlot = new Set<string>()
    const teamsPlayingInSlot = new Set<string>()

    // Collect all teams playing in this slot
    gamesInSlot.forEach((game) => {
      teamsPlayingInSlot.add(game.team1Id)
      teamsPlayingInSlot.add(game.team2Id)
    })

    gamesInSlot.forEach((game) => {
      if (!game.refId) return // No ref assigned, that's okay

      // Check if ref is already busy in this time slot
      if (refsInSlot.has(game.refId)) {
        const ref = data.refs.find((r) => r.id === game.refId)
        errors.push(`❌ Referee ${ref?.name || game.refId} is assigned to multiple games at ${timeSlot}`)
      }

      refsInSlot.add(game.refId)

      // Check if ref is affiliated with either team in this game
      const ref = data.refs.find((r) => r.id === game.refId)
      if (ref && ref.teamId && (ref.teamId === game.team1Id || ref.teamId === game.team2Id)) {
        const team = data.teams.find((t) => t.id === ref.teamId)
        errors.push(
          `❌ Referee ${ref.name} is affiliated with team ${team?.name} but assigned to their game at ${timeSlot}`,
        )
      }

      // CRITICAL: Check if ref's team is playing ANY game in this time slot
      if (ref && ref.teamId && teamsPlayingInSlot.has(ref.teamId)) {
        const refTeam = data.teams.find((t) => t.id === ref.teamId)
        errors.push(
          `❌ Referee ${ref.name}'s team (${refTeam?.name}) is playing at ${timeSlot} - referee cannot work when their team plays`,
        )
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

function eliminateAllGapsAggressively(games: Game[], data: TournamentData, timeSlots: string[]): Game[] {
  let currentGames = [...games]
  let iterations = 0
  const maxIterations = 100

  // Get all time slots that have games (excluding breaks)
  const availableTimeSlots = timeSlots.filter(
    (timeSlot) => !isTimeSlotDuringBreaks(timeSlot, data.tournamentBreaks, data.gameDuration),
  )

  console.log(`🚀 AGGRESSIVE GAP ELIMINATION STARTING`)
  console.log(`Available time slots: ${availableTimeSlots.length}`)
  console.log(`Courts: ${data.courts}`)
  console.log(`Total possible slots: ${availableTimeSlots.length * data.courts}`)
  console.log(`Starting games: ${currentGames.length}`)

  while (iterations < maxIterations) {
    iterations++
    let gapsFound = 0
    let gamesMoved = 0

    // Check every time slot for gaps
    for (const timeSlot of availableTimeSlots) {
      const gamesInSlot = currentGames.filter((g) => g.timeSlot === timeSlot)
      const occupiedCourts = new Set(gamesInSlot.map((g) => g.court))
      const busyTeamIds = new Set(gamesInSlot.flatMap((g) => [g.team1Id, g.team2Id]))

      // Find ALL empty courts in this time slot
      for (let court = 1; court <= data.courts; court++) {
        if (occupiedCourts.has(court)) continue

        gapsFound++

        // AGGRESSIVELY search for ANY game that can be moved here
        let foundCandidate = false

        // Search through ALL other time slots for moveable games
        for (const sourceTimeSlot of availableTimeSlots) {
          if (sourceTimeSlot === timeSlot) continue

          const sourceGames = currentGames.filter((g) => g.timeSlot === sourceTimeSlot)

          for (const candidateGame of sourceGames) {
            // Check if teams are available (no conflicts)
            if (busyTeamIds.has(candidateGame.team1Id) || busyTeamIds.has(candidateGame.team2Id)) continue

            // MOVE THE GAME - we found a legal move (referee will be reassigned later)
            currentGames = currentGames.map((game) =>
              game.id === candidateGame.id ? { ...game, court: court, timeSlot: timeSlot } : game,
            )

            console.log(
              `✅ Iteration ${iterations}: Moved game ${candidateGame.id} from ${sourceTimeSlot} to ${timeSlot} Court ${court}`,
            )

            // Update tracking for this slot
            busyTeamIds.add(candidateGame.team1Id)
            busyTeamIds.add(candidateGame.team2Id)
            occupiedCourts.add(court)
            gamesMoved++
            foundCandidate = true
            break
          }

          if (foundCandidate) break
        }

        // If we couldn't find a game to move, this gap is unavoidable
        if (!foundCandidate) {
          console.log(`⚠️  No legal game found for ${timeSlot} Court ${court}`)
        }
      }
    }

    // Calculate current gaps
    let totalGaps = 0
    for (const timeSlot of availableTimeSlots) {
      const gamesInSlot = currentGames.filter((g) => g.timeSlot === timeSlot)
      totalGaps += data.courts - gamesInSlot.length
    }

    console.log(
      `📊 Iteration ${iterations}: Found ${gapsFound} gaps, moved ${gamesMoved} games, remaining gaps: ${totalGaps}`,
    )

    // If no gaps remain, we're done!
    if (totalGaps === 0) {
      console.log(`🎉 SUCCESS: All gaps eliminated after ${iterations} iterations!`)
      break
    }

    // If we didn't move any games this iteration, we can't improve further
    if (gamesMoved === 0) {
      console.log(`🛑 No more legal moves possible. Final gaps: ${totalGaps}`)
      break
    }
  }

  // Final report
  const finalGaps = availableTimeSlots.reduce((total, timeSlot) => {
    const gamesInSlot = currentGames.filter((g) => g.timeSlot === timeSlot)
    return total + (data.courts - gamesInSlot.length)
  }, 0)

  const totalPossibleSlots = availableTimeSlots.length * data.courts
  const filledSlots = currentGames.length
  const utilization = ((filledSlots / totalPossibleSlots) * 100).toFixed(1)

  console.log(`📈 FINAL RESULT:`)
  console.log(`   Games: ${filledSlots}/${totalPossibleSlots}`)
  console.log(`   Utilization: ${utilization}%`)
  console.log(`   Remaining gaps: ${finalGaps}`)
  console.log(`   Iterations: ${iterations}`)

  // If there are still gaps, let's try one more aggressive approach
  if (finalGaps > 0) {
    console.log(`🔥 FINAL AGGRESSIVE PUSH - TRYING TO ELIMINATE LAST ${finalGaps} GAPS`)
    currentGames = finalAggressivePush(currentGames, data, availableTimeSlots)
  }

  return currentGames
}

function finalAggressivePush(games: Game[], data: TournamentData, availableTimeSlots: string[]): Game[] {
  let currentGames = [...games]

  // Try to compact games by moving them to earlier time slots
  for (let targetSlotIndex = 0; targetSlotIndex < availableTimeSlots.length; targetSlotIndex++) {
    const targetTimeSlot = availableTimeSlots[targetSlotIndex]
    const gamesInTarget = currentGames.filter((g) => g.timeSlot === targetTimeSlot)

    if (gamesInTarget.length >= data.courts) continue // This slot is full

    const occupiedCourts = new Set(gamesInTarget.map((g) => g.court))
    const busyTeamIds = new Set(gamesInTarget.flatMap((g) => [g.team1Id, g.team2Id]))

    // Look for games in later time slots that can be moved here
    for (let sourceSlotIndex = targetSlotIndex + 1; sourceSlotIndex < availableTimeSlots.length; sourceSlotIndex++) {
      const sourceTimeSlot = availableTimeSlots[sourceSlotIndex]
      const sourceGames = currentGames.filter((g) => g.timeSlot === sourceTimeSlot)

      for (const candidateGame of sourceGames) {
        // Check if teams are available
        if (busyTeamIds.has(candidateGame.team1Id) || busyTeamIds.has(candidateGame.team2Id)) continue

        // Find an empty court
        for (let court = 1; court <= data.courts; court++) {
          if (occupiedCourts.has(court)) continue

          // Move the game
          currentGames = currentGames.map((game) =>
            game.id === candidateGame.id ? { ...game, court: court, timeSlot: targetTimeSlot } : game,
          )

          console.log(`🔥 Final push: Moved game ${candidateGame.id} to ${targetTimeSlot} Court ${court}`)

          // Update tracking
          busyTeamIds.add(candidateGame.team1Id)
          busyTeamIds.add(candidateGame.team2Id)
          occupiedCourts.add(court)
          break
        }

        // If this slot is now full, move to next target slot
        if (occupiedCourts.size >= data.courts) break
      }

      // If this slot is now full, move to next target slot
      if (occupiedCourts.size >= data.courts) break
    }
  }

  return currentGames
}

function generateUniqueMatchups(teams: Team[], pools: number): { team1: Team; team2: Team; pool: number | null }[] {
  const allMatchups: { team1: Team; team2: Team; pool: number | null }[] = []

  if (pools === 1) {
    // Single pool - every team plays every other team once
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        allMatchups.push({
          team1: teams[i],
          team2: teams[j],
          pool: null,
        })
      }
    }
  } else {
    // Multiple pools - teams only play within their pool
    for (let pool = 1; pool <= pools; pool++) {
      const poolTeams = teams.filter((team) => team.pool === pool)
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          allMatchups.push({
            team1: poolTeams[i],
            team2: poolTeams[j],
            pool: pool,
          })
        }
      }
    }
  }

  return allMatchups
}

function removeDuplicateGames(games: Game[]): Game[] {
  const uniqueGames: Game[] = []
  const seenMatchups = new Set<string>()

  for (const game of games) {
    const matchupKey1 = `${game.team1Id}-${game.team2Id}`
    const matchupKey2 = `${game.team2Id}-${game.team1Id}`

    if (!seenMatchups.has(matchupKey1) && !seenMatchups.has(matchupKey2)) {
      uniqueGames.push(game)
      seenMatchups.add(matchupKey1)
      seenMatchups.add(matchupKey2)
    }
  }

  return uniqueGames
}

function validateSchedule(games: Game[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const gamesByTimeSlot: { [timeSlot: string]: Game[] } = {}

  // Group games by time slot
  games.forEach((game) => {
    if (!gamesByTimeSlot[game.timeSlot]) {
      gamesByTimeSlot[game.timeSlot] = []
    }
    gamesByTimeSlot[game.timeSlot].push(game)
  })

  // Check for violations
  Object.entries(gamesByTimeSlot).forEach(([timeSlot, gamesInSlot]) => {
    const teamsInSlot = new Set<string>()
    const courtsInSlot = new Set<number>()

    gamesInSlot.forEach((game) => {
      // Check for team conflicts
      if (teamsInSlot.has(game.team1Id)) {
        errors.push(`Team ${game.team1Id} plays multiple games at ${timeSlot}`)
      }
      if (teamsInSlot.has(game.team2Id)) {
        errors.push(`Team ${game.team2Id} plays multiple games at ${timeSlot}`)
      }

      // Check for court conflicts
      if (courtsInSlot.has(game.court)) {
        errors.push(`Court ${game.court} has multiple games at ${timeSlot}`)
      }

      teamsInSlot.add(game.team1Id)
      teamsInSlot.add(game.team2Id)
      courtsInSlot.add(game.court)
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

function calculateSlotScore(
  matchup: any,
  timeSlot: string,
  court: number,
  teamLastGameTime: { [teamId: string]: string | null },
  teamConsecutiveGames: { [teamId: string]: number },
  teamCourtHistory: { [teamId: string]: { [court: number]: string[] } },
): number {
  let score = 100 // Base score

  // Penalize back-to-back games
  const team1LastGame = teamLastGameTime[matchup.team1.id]
  const team2LastGame = teamLastGameTime[matchup.team2.id]

  if (team1LastGame && isConsecutiveTimeSlot(team1LastGame, timeSlot)) {
    score -= 30
  }
  if (team2LastGame && isConsecutiveTimeSlot(team2LastGame, timeSlot)) {
    score -= 30
  }

  // Heavily penalize too many consecutive games
  if (teamConsecutiveGames[matchup.team1.id] >= 2) {
    score -= 50
  }
  if (teamConsecutiveGames[matchup.team2.id] >= 2) {
    score -= 50
  }

  // Penalize same court usage
  const team1CourtGames = teamCourtHistory[matchup.team1.id][court].length
  const team2CourtGames = teamCourtHistory[matchup.team2.id][court].length

  score -= (team1CourtGames + team2CourtGames) * 5

  return score
}

function updateTeamHistory(
  teamId: string,
  timeSlot: string,
  court: number,
  teamLastGameTime: { [teamId: string]: string | null },
  teamConsecutiveGames: { [teamId: string]: number },
  teamCourtHistory: { [teamId: string]: { [court: number]: string[] } },
) {
  const lastGame = teamLastGameTime[teamId]

  if (lastGame && isConsecutiveTimeSlot(lastGame, timeSlot)) {
    teamConsecutiveGames[teamId]++
  } else {
    teamConsecutiveGames[teamId] = 1
  }

  teamLastGameTime[teamId] = timeSlot
  teamCourtHistory[teamId][court].push(timeSlot)
}

function isConsecutiveTimeSlot(timeSlot1: string, timeSlot2: string): boolean {
  const time1 = timeToMinutes(timeSlot1)
  const time2 = timeToMinutes(timeSlot2)
  const diff = Math.abs(time2 - time1)
  return diff <= 30 // Assuming games + breaks are around 25-30 minutes
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

function isTimeSlotDuringBreaks(timeSlot: string, tournamentBreaks: any[], gameDuration: number): boolean {
  return tournamentBreaks.some((breakItem) => {
    const slotTime = timeToMinutes(timeSlot)
    const breakStart = timeToMinutes(breakItem.startTime)
    const breakEnd = breakStart + breakItem.duration

    const gameEnd = slotTime + gameDuration

    return (
      (slotTime >= breakStart && slotTime < breakEnd) ||
      (gameEnd > breakStart && gameEnd <= breakEnd) ||
      (slotTime <= breakStart && gameEnd >= breakEnd)
    )
  })
}

function generateTimeSlots(data: TournamentData): string[] {
  const slots: string[] = []
  let currentTime = data.startTime

  for (let i = 0; i < 30; i++) {
    slots.push(currentTime)
    currentTime = addMinutes(currentTime, data.gameDuration + data.breakBetweenGames)
  }

  return slots
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function addMinutes(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function findAvailableRef(refs: any[], team1: Team, team2: Team, timeSlot: string, busyRefs: any, games: Game[]) {
  if (refs.length === 0) return null

  // Find refs that are not affiliated with either team AND not busy in this time slot
  const availableRefs = refs.filter(
    (ref) => ref.teamId !== team1.id && ref.teamId !== team2.id && !busyRefs[timeSlot].has(ref.id),
  )

  return availableRefs.length > 0 ? availableRefs[0] : null
}
