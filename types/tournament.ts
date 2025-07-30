export interface Team {
  id: string
  name: string
  pool: number | null
  color: string
}

export interface Ref {
  id: string
  name: string
  teamId: string | null
}

export interface TournamentBreak {
  id: string
  startTime: string
  duration: number
}

export interface TournamentData {
  tournamentName: string
  pools: number
  courts: number
  teams: Team[]
  refs: Ref[]
  startTime: string
  gameDuration: number
  breakBetweenGames: number
  tournamentBreaks: TournamentBreak[]
}

export interface Game {
  id: string
  team1Id: string
  team2Id: string
  court: number
  timeSlot: string
  pool: number | null
  refId: string | null
}
