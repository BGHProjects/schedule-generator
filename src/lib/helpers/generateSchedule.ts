import { ScheduleInput, Game, Team } from "../types/types";

export const generateSchedule = (input: ScheduleInput): Game[] => {
  const { teams, times, courts, gamesPerTeam } = input;
  const numTeams = teams.length;
  const games: Game[] = [];

  if (numTeams < 2) {
    return [];
  }

  const targetGamesPerTeam =
    gamesPerTeam === "FILL" ? numTeams - 1 : Number(gamesPerTeam);
  const maxGamesPerTeam = Math.min(targetGamesPerTeam, numTeams - 1);

  const teamGameCounts: { [teamName: string]: number } = {};
  teams.forEach((team) => (teamGameCounts[team.name] = 0));

  const playedMatches: Set<string> = new Set();
  const teamTimeSlots: {
    [teamName: string]: { startTime: string; endTime: string; court: number }[];
  } = {};
  teams.forEach((team) => (teamTimeSlots[team.name] = []));

  // @ts-ignore
  let gameIndex = 0;
  let currentTime = times.startTime;
  const maxRounds = Math.ceil((maxGamesPerTeam * numTeams) / (2 * courts)) * 2; // Estimate max rounds needed

  // Iterate over rounds instead of while loop
  for (let round = 0; round < maxRounds; round++) {
    let availableTeams = [...teams];
    let gamesScheduledThisRound = 0;

    // Iterate over courts instead of while loop
    for (let courtIndex = 1; courtIndex <= courts; courtIndex++) {
      if (availableTeams.length < 2) {
        break;
      }

      let gameScheduled = false;

      // Try to schedule a game on this court
      for (let i = 0; i < availableTeams.length && !gameScheduled; i++) {
        for (let j = i + 1; j < availableTeams.length && !gameScheduled; j++) {
          const team1 = availableTeams[i];
          const team2 = availableTeams[j];

          if (
            teamGameCounts[team1.name] >= maxGamesPerTeam ||
            teamGameCounts[team2.name] >= maxGamesPerTeam
          ) {
            continue;
          }

          const matchKey = [team1.name, team2.name].sort().join("-");
          if (playedMatches.has(matchKey)) {
            continue;
          }

          const endTime = calculateEndTime(currentTime, times.gameLength);

          // Check time availability including unavailableBefore/After
          const team1Available = isTeamAvailable(
            team1,
            currentTime,
            endTime,
            teamTimeSlots
          );
          const team2Available = isTeamAvailable(
            team2,
            currentTime,
            endTime,
            teamTimeSlots
          );

          const team1PrevCourt =
            teamTimeSlots[team1.name].length > 0
              ? teamTimeSlots[team1.name][teamTimeSlots[team1.name].length - 1]
                  .court
              : 0;
          const team2PrevCourt =
            teamTimeSlots[team2.name].length > 0
              ? teamTimeSlots[team2.name][teamTimeSlots[team2.name].length - 1]
                  .court
              : 0;

          if (
            team1Available &&
            team2Available &&
            courtIndex !== team1PrevCourt &&
            courtIndex !== team2PrevCourt
          ) {
            games.push({
              team1: { name: team1.name, colour: team1.colour },
              team2: { name: team2.name, colour: team2.colour },
              court: courtIndex,
              startTime: currentTime,
              endTime: endTime,
              round: round + 1,
            });

            teamGameCounts[team1.name]++;
            teamGameCounts[team2.name]++;
            playedMatches.add(matchKey);

            teamTimeSlots[team1.name].push({
              startTime: currentTime,
              endTime,
              court: courtIndex,
            });
            teamTimeSlots[team2.name].push({
              startTime: currentTime,
              endTime,
              court: courtIndex,
            });

            availableTeams = availableTeams.filter(
              (team) => team.name !== team1.name && team.name !== team2.name
            );
            gameScheduled = true;
            gamesScheduledThisRound++;
            gameIndex++;
          }
        }
      }
    }

    // Move to next time slot if any games were scheduled or if we need to try again
    if (gamesScheduledThisRound > 0 || availableTeams.length >= 2) {
      currentTime = calculateNextStartTime(
        calculateEndTime(currentTime, times.gameLength),
        times.timeBetweenGames
      );
    } else {
      break;
    }

    // Early exit if all teams have enough games
    if (teams.every((team) => teamGameCounts[team.name] >= maxGamesPerTeam)) {
      break;
    }
  }

  return games;
};

// Helper function to check team availability including unavailableBefore/After
const isTeamAvailable = (
  team: Team,
  startTime: string,
  endTime: string,
  teamTimeSlots: {
    [teamName: string]: { startTime: string; endTime: string; court: number }[];
  }
): boolean => {
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Check unavailableBefore
  if (team.unavailableBefore) {
    const unavailableBeforeMinutes = timeToMinutes(team.unavailableBefore);
    if (startMinutes < unavailableBeforeMinutes) {
      return false;
    }
  }

  // Check unavailableAfter
  if (team.unavailableAfter) {
    const unavailableAfterMinutes = timeToMinutes(team.unavailableAfter);
    if (endMinutes > unavailableAfterMinutes) {
      return false;
    }
  }

  // Check existing time slots
  return !teamTimeSlots[team.name].some(
    (slot) =>
      timeToMinutes(slot.startTime) < endMinutes &&
      timeToMinutes(slot.endTime) > startMinutes
  );
};

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
