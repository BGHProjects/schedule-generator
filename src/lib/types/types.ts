export interface ScheduleInput {
  teams: string[];
  times: { startTime: string; gameLength: number; timeBetweenGames: number };
  courts: number;
  gamesPerTeam: number | string;
}

export enum AppState {
  LandingPage = "LandingPage",
  Inputting = "Inputting",
  Generated = "Generated",
}

export enum InputState {
  Teams = "Teams",
  Times = "Times",
  Courts = "Courts",
  Rounds = "Rounds",
  Completed = "Completed",
}

export interface Game {
  team1: string;
  team2: string;
  court: number;
  startTime: string;
  endTime: string;
  round: number;
}
