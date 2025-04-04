import { Game } from "../types/types";

/**
 * Groups an array of games by team, returning an object where each key is a team name
 * and each value is an array of games that team participates in.
 *
 * @param {Game[]} games - An array of game objects to process.
 * @returns {{ [team: string]: Game[] }} An object mapping each team to its games.
 * @example
 * const games = [
 *   { team1: "Team A", team2: "Team B", court: 1, startTime: "09:00", endTime: "09:30", round: 1 },
 *   { team1: "Team A", team2: "Team C", court: 2, startTime: "09:30", endTime: "10:00", round: 2 }
 * ];
 * const result = groupGamesByTeam(games);
 * result = {
 *   "Team A": [{...game1}, {...game2}],
 *   "Team B": [{...game1}],
 *   "Team C": [{...game2}]
 * }
 */
export const groupGamesByTeam = (
  games: Game[]
): { [team: string]: { games: Game[]; colour: string } } => {
  const teamGames: { [team: string]: { games: Game[]; colour: string } } = {};

  // Iterate through each game
  for (const game of games) {
    const { team1, team2 } = game;

    // Initialize arrays for teams if not already present
    if (!teamGames[team1.name]) {
      teamGames[team1.name] = { games: [], colour: team1.colour };
    }
    if (!teamGames[team2.name]) {
      teamGames[team2.name] = { games: [], colour: team2.colour };
    }

    // Add the game to both teams' arrays
    teamGames[team1.name].games.push(game);
    teamGames[team2.name].games.push(game);
  }

  return teamGames;
};
