import type { Game, TournamentData } from "@/types/tournament"

interface ValidationResult {
  isValid: boolean
  reason?: string
  details?: any
}

export function validateGameMove(
  game: Game,
  newCourt: number,
  newTimeSlot: string,
  schedule: Game[],
  data: TournamentData,
): ValidationResult {
  // Get team names for better error messages
  const team1 = data.teams.find((t) => t.id === game.team1Id)
  const team2 = data.teams.find((t) => t.id === game.team2Id)

  // Rule 1: Check if moving team would conflict with existing games at destination
  const conflictingGames = schedule.filter(
    (g) =>
      g.id !== game.id &&
      g.timeSlot === newTimeSlot &&
      (g.team1Id === game.team1Id ||
        g.team1Id === game.team2Id ||
        g.team2Id === game.team1Id ||
        g.team2Id === game.team2Id),
  )

  if (conflictingGames.length > 0) {
    const conflictGame = conflictingGames[0]
    const conflictTeam1 = data.teams.find((t) => t.id === conflictGame.team1Id)
    const conflictTeam2 = data.teams.find((t) => t.id === conflictGame.team2Id)

    // Determine which team is causing the conflict
    let conflictingTeam = ""
    if (conflictGame.team1Id === game.team1Id || conflictGame.team2Id === game.team1Id) {
      conflictingTeam = team1?.name || "Unknown Team"
    } else {
      conflictingTeam = team2?.name || "Unknown Team"
    }

    return {
      isValid: false,
      reason: "team_conflict",
      details: {
        conflictingTeam,
        conflictGame: `${conflictTeam1?.name} vs ${conflictTeam2?.name}`,
        conflictCourt: conflictGame.court,
        movingGame: `${team1?.name} vs ${team2?.name}`,
        destinationTime: newTimeSlot,
        destinationCourt: newCourt,
      },
    }
  }

  // Rule 2: Check if there's a game at destination that would need to be swapped
  const gameAtDestination = schedule.find((g) => g.id !== game.id && g.court === newCourt && g.timeSlot === newTimeSlot)

  if (gameAtDestination) {
    // This is a swap scenario - validate the swap
    const swapValidation = validateSwap(game, gameAtDestination, schedule, data)
    if (!swapValidation.isValid) {
      return swapValidation
    }
  }

  // Rule 3: Validate referee assignment for the moving game
  if (game.refId) {
    const refValidation = validateRefereeForMove(game, newTimeSlot, schedule, data)
    if (!refValidation.isValid) {
      return refValidation
    }
  }

  return { isValid: true }
}

function validateSwap(gameA: Game, gameB: Game, schedule: Game[], data: TournamentData): ValidationResult {
  const teamA1 = data.teams.find((t) => t.id === gameA.team1Id)
  const teamA2 = data.teams.find((t) => t.id === gameA.team2Id)
  const teamB1 = data.teams.find((t) => t.id === gameB.team1Id)
  const teamB2 = data.teams.find((t) => t.id === gameB.team2Id)

  // Check if gameB's teams would conflict at gameA's original position
  const gameAConflicts = schedule.filter(
    (g) =>
      g.id !== gameA.id &&
      g.id !== gameB.id &&
      g.timeSlot === gameA.timeSlot &&
      (g.team1Id === gameB.team1Id ||
        g.team1Id === gameB.team2Id ||
        g.team2Id === gameB.team1Id ||
        g.team2Id === gameB.team2Id),
  )

  if (gameAConflicts.length > 0) {
    const conflict = gameAConflicts[0]
    const conflictTeam1 = data.teams.find((t) => t.id === conflict.team1Id)
    const conflictTeam2 = data.teams.find((t) => t.id === conflict.team2Id)

    // Determine which team from gameB is causing the conflict
    let conflictingTeam = ""
    if (conflict.team1Id === gameB.team1Id || conflict.team2Id === gameB.team1Id) {
      conflictingTeam = teamB1?.name || "Unknown Team"
    } else {
      conflictingTeam = teamB2?.name || "Unknown Team"
    }

    return {
      isValid: false,
      reason: "swap_destination_conflict",
      details: {
        gameA: `${teamA1?.name} vs ${teamA2?.name}`,
        gameB: `${teamB1?.name} vs ${teamB2?.name}`,
        conflictingTeam,
        conflictGame: `${conflictTeam1?.name} vs ${conflictTeam2?.name}`,
        conflictTime: gameA.timeSlot,
        conflictCourt: conflict.court,
      },
    }
  }

  // Check if there's already a game at gameA's court and time (other than gameA itself)
  const courtConflictAtA = schedule.find(
    (g) => g.id !== gameA.id && g.id !== gameB.id && g.court === gameA.court && g.timeSlot === gameA.timeSlot,
  )

  if (courtConflictAtA) {
    const conflictTeam1 = data.teams.find((t) => t.id === courtConflictAtA.team1Id)
    const conflictTeam2 = data.teams.find((t) => t.id === courtConflictAtA.team2Id)

    return {
      isValid: false,
      reason: "swap_court_occupied",
      details: {
        gameA: `${teamA1?.name} vs ${teamA2?.name}`,
        gameB: `${teamB1?.name} vs ${teamB2?.name}`,
        occupiedCourt: gameA.court,
        occupiedTime: gameA.timeSlot,
        occupyingGame: `${conflictTeam1?.name} vs ${conflictTeam2?.name}`,
      },
    }
  }

  // Validate referee assignments for both games after swap
  if (gameA.refId) {
    const refValidationA = validateRefereeForMove(gameA, gameB.timeSlot, schedule, data)
    if (!refValidationA.isValid) {
      return {
        ...refValidationA,
        reason: "swap_ref_conflict_a",
        details: {
          ...refValidationA.details,
          gameA: `${teamA1?.name} vs ${teamA2?.name}`,
          gameB: `${teamB1?.name} vs ${teamB2?.name}`,
        },
      }
    }
  }

  if (gameB.refId) {
    const refValidationB = validateRefereeForMove(gameB, gameA.timeSlot, schedule, data)
    if (!refValidationB.isValid) {
      return {
        ...refValidationB,
        reason: "swap_ref_conflict_b",
        details: {
          ...refValidationB.details,
          gameA: `${teamA1?.name} vs ${teamA2?.name}`,
          gameB: `${teamB1?.name} vs ${teamB2?.name}`,
        },
      }
    }
  }

  return { isValid: true }
}

function validateRefereeForMove(
  game: Game,
  newTimeSlot: string,
  schedule: Game[],
  data: TournamentData,
): ValidationResult {
  const ref = data.refs.find((r) => r.id === game.refId)
  if (!ref) return { isValid: true } // No ref assigned

  const team1 = data.teams.find((t) => t.id === game.team1Id)
  const team2 = data.teams.find((t) => t.id === game.team2Id)

  // Check if ref is affiliated with either team (this shouldn't happen, but let's be safe)
  if (ref.teamId && (ref.teamId === game.team1Id || ref.teamId === game.team2Id)) {
    const refTeam = data.teams.find((t) => t.id === ref.teamId)
    return {
      isValid: false,
      reason: "ref_team_conflict",
      details: {
        refName: ref.name,
        refTeam: refTeam?.name,
        game: `${team1?.name} vs ${team2?.name}`,
        timeSlot: newTimeSlot,
      },
    }
  }

  // Check if ref is already busy at the new time slot
  const refBusyGame = schedule.find((g) => g.id !== game.id && g.refId === game.refId && g.timeSlot === newTimeSlot)

  if (refBusyGame) {
    const busyTeam1 = data.teams.find((t) => t.id === refBusyGame.team1Id)
    const busyTeam2 = data.teams.find((t) => t.id === refBusyGame.team2Id)

    return {
      isValid: false,
      reason: "ref_busy",
      details: {
        refName: ref.name,
        game: `${team1?.name} vs ${team2?.name}`,
        timeSlot: newTimeSlot,
        busyGame: `${busyTeam1?.name} vs ${busyTeam2?.name}`,
        busyCourt: refBusyGame.court,
      },
    }
  }

  // Check if ref's team is playing at the new time slot
  if (ref.teamId) {
    const refTeamGame = schedule.find(
      (g) => g.id !== game.id && g.timeSlot === newTimeSlot && (g.team1Id === ref.teamId || g.team2Id === ref.teamId),
    )

    if (refTeamGame) {
      const refTeam = data.teams.find((t) => t.id === ref.teamId)
      const playingTeam1 = data.teams.find((t) => t.id === refTeamGame.team1Id)
      const playingTeam2 = data.teams.find((t) => t.id === refTeamGame.team2Id)

      return {
        isValid: false,
        reason: "ref_team_playing",
        details: {
          refName: ref.name,
          refTeam: refTeam?.name,
          game: `${team1?.name} vs ${team2?.name}`,
          timeSlot: newTimeSlot,
          refTeamGame: `${playingTeam1?.name} vs ${playingTeam2?.name}`,
          refTeamCourt: refTeamGame.court,
        },
      }
    }
  }

  return { isValid: true }
}

export function getValidationError(reason: string, details: any): string {
  switch (reason) {
    case "team_conflict":
      return `❌ TEAM CONFLICT\n\nCannot move "${details.movingGame}" to ${details.destinationTime} Court ${details.destinationCourt}.\n\n🔍 SPECIFIC ISSUE:\n${details.conflictingTeam} is already playing "${details.conflictGame}" on Court ${details.conflictCourt} at ${details.destinationTime}.\n\n📋 RULE: No team can play multiple games simultaneously.`

    case "swap_destination_conflict":
      return `❌ SWAP CONFLICT\n\nCannot swap "${details.gameA}" with "${details.gameB}".\n\n🔍 SPECIFIC ISSUE:\nIf "${details.gameB}" moves to the first game's time slot, ${details.conflictingTeam} would conflict with "${details.conflictGame}" on Court ${details.conflictCourt} at ${details.conflictTime}.\n\n📋 RULE: Game swaps must not create team scheduling conflicts.`

    case "swap_court_occupied":
      return `❌ SWAP BLOCKED\n\nCannot swap "${details.gameA}" with "${details.gameB}".\n\n🔍 SPECIFIC ISSUE:\nCourt ${details.occupiedCourt} at ${details.occupiedTime} is already occupied by "${details.occupyingGame}".\n\n📋 RULE: Each court can only host one game per time slot.`

    case "swap_ref_conflict_a":
      return `❌ REFEREE SWAP CONFLICT\n\nCannot swap "${details.gameA}" with "${details.gameB}".\n\n🔍 SPECIFIC ISSUE:\nThe first game's referee (${details.refName}) would have a conflict at the new time slot.\n\n${getRefConflictDetails(details)}`

    case "swap_ref_conflict_b":
      return `❌ REFEREE SWAP CONFLICT\n\nCannot swap "${details.gameA}" with "${details.gameB}".\n\n🔍 SPECIFIC ISSUE:\nThe second game's referee (${details.refName}) would have a conflict at the new time slot.\n\n${getRefConflictDetails(details)}`

    case "ref_team_conflict":
      return `❌ REFEREE TEAM CONFLICT\n\nCannot move "${details.game}" to ${details.timeSlot}.\n\n🔍 SPECIFIC ISSUE:\nReferee ${details.refName} is affiliated with ${details.refTeam}, which is playing in this game.\n\n📋 RULE: Referees cannot officiate games involving their own team.`

    case "ref_busy":
      return `❌ REFEREE BUSY\n\nCannot move "${details.game}" to ${details.timeSlot}.\n\n🔍 SPECIFIC ISSUE:\nReferee ${details.refName} is already officiating "${details.busyGame}" on Court ${details.busyCourt} at ${details.timeSlot}.\n\n📋 RULE: Referees can only officiate one game per time slot.`

    case "ref_team_playing":
      return `❌ REFEREE TEAM PLAYING\n\nCannot move "${details.game}" to ${details.timeSlot}.\n\n🔍 SPECIFIC ISSUE:\nReferee ${details.refName}'s team (${details.refTeam}) is playing "${details.refTeamGame}" on Court ${details.refTeamCourt} at ${details.timeSlot}.\n\n📋 RULE: Referees cannot work when their own team is playing.`

    default:
      return `❌ INVALID MOVE\n\nThis move would violate tournament rules.\n\n📋 Please check for team conflicts, court availability, and referee assignments.`
  }
}

function getRefConflictDetails(details: any): string {
  if (details.refTeam) {
    return `📋 RULE: Referee ${details.refName}'s team (${details.refTeam}) would be playing at the new time slot.`
  } else if (details.busyGame) {
    return `📋 RULE: Referee ${details.refName} would be officiating "${details.busyGame}" on Court ${details.busyCourt}.`
  } else {
    return `📋 RULE: Referee assignment would create a conflict.`
  }
}
