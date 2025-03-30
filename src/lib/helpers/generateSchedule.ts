import { ScheduleInput, Game } from "../types/types";

/**
 * Generates a schedule for a sports event, ensuring even distribution of games across teams, courts, and rounds.
 *
 * @param {ScheduleInput} input - The input object containing teams, times, courts, and rounds.
 * @returns {Game[]} - An array of Game objects representing the generated schedule.
 *
 * @example
 * const input = {
 * teams: ["Team A", "Team B", "Team C", "Team D"],
 * times: { startTime: "10:00", gameLength: 60, timeBetweenGames: 15 },
 * courts: 2,
 * rounds: 1,
 * };
 * const schedule = generateSchedule(input);
 *  Example output:
 *  [
 *    { "team1": "Team A", "team2": "Team D", "court": 1, "startTime": "10:00", "endTime": "11:00", "round": 1 },
 *    { "team1": "Team B", "team2": "Team C", "court": 2, "startTime": "10:00", "endTime": "11:00", "round": 1 }
 *  ]
 */
export const generateSchedule = (input: ScheduleInput): Game[] => {
  const { teams, times, courts, rounds } = input;
  const numTeams = teams.length;
  const games: Game[] = [];

  if (numTeams < 2) {
    return [];
  }

  if (rounds > 0 && numTeams > 1) {
    let pairings: [string, string][] = [];

    for (let round = 1; round <= rounds; round++) {
      let roundPairings: [string, string][] = [];
      const roundTeams = [...teams];

      if (numTeams % 2 !== 0) {
        roundTeams.push("BYE");
      }

      const numRoundTeams = roundTeams.length;

      for (let i = 0; i < numRoundTeams / 2; i++) {
        if (
          roundTeams[i] !== "BYE" &&
          roundTeams[numRoundTeams - 1 - i] !== "BYE"
        ) {
          roundPairings.push([
            roundTeams[i],
            roundTeams[numRoundTeams - 1 - i],
          ]);
        }
      }

      pairings = pairings.concat(roundPairings);

      if (numTeams % 2 === 0) {
        const first = roundTeams[0];
        roundTeams.shift();
        roundTeams.push(first);
      } else {
        const first = roundTeams[0];
        const last = roundTeams[numRoundTeams - 1];
        roundTeams.shift();
        roundTeams.pop();
        roundTeams.splice(1, 0, last);
        roundTeams.unshift(first);
      }
    }

    let currentTime = times.startTime;
    let courtIndex = 1;
    let roundIndex = 1;
    let gameIndex = 0;
    let gamesInRound = 0;

    for (const pairing of pairings) {
      if (pairing[0] !== "BYE" && pairing[1] !== "BYE") {
        const startTime = currentTime;
        const endTime = calculateEndTime(startTime, times.gameLength);

        games.push({
          team1: pairing[0],
          team2: pairing[1],
          court: courtIndex,
          startTime: startTime,
          endTime: endTime,
          round: roundIndex,
        });

        courtIndex++;
        gameIndex++;
        gamesInRound++;

        if (courtIndex > courts) {
          courtIndex = 1;
          currentTime = calculateNextStartTime(endTime, times.timeBetweenGames);
        }

        if (numTeams % 2 === 0 && gamesInRound === courts * (numTeams / 2)) {
          roundIndex++;
          currentTime = times.startTime;
          gameIndex = 0;
          gamesInRound = 0;
        } else if (
          numTeams % 2 !== 0 &&
          gamesInRound === courts * ((numTeams - 1) / 2)
        ) {
          roundIndex++;
          currentTime = times.startTime;
          gameIndex = 0;
          gamesInRound = 0;
        }
      }
    }
  }

  return games;
};

/**
 * Calculates the end time of a game based on the start time and game length.
 *
 * @param {string} startTime - The start time of the game in "HH:MM" format.
 * @param {number} gameLength - The length of the game in minutes.
 * @returns {string} - The end time of the game in "HH:MM" format.
 */
const calculateEndTime = (startTime: string, gameLength: number): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + gameLength;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
};

/**
 * Calculates the start time of the next game based on the end time of the previous game and the time between games.
 *
 * @param {string} endTime - The end time of the previous game in "HH:MM" format.
 * @param {number} timeBetweenGames - The time between games in minutes.
 * @returns {string} - The start time of the next game in "HH:MM" format.
 */
const calculateNextStartTime = (
  endTime: string,
  timeBetweenGames: number
): string => {
  const [hours, minutes] = endTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + timeBetweenGames;
  const nextHours = Math.floor(totalMinutes / 60) % 24;
  const nextMinutes = totalMinutes % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(
    2,
    "0"
  )}`;
};
