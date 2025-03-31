import { ScheduleInput, Game } from "../types/types";

export const generateSchedule = (input: ScheduleInput): Game[] => {
  const { teams, times, courts, gamesPerTeam } = input;
  const numTeams = teams.length;
  const games: Game[] = [];

  if (numTeams < 2) {
    return [];
  }

  let targetGamesPerTeam =
    gamesPerTeam === "FILL" ? numTeams - 1 : Number(gamesPerTeam);
  targetGamesPerTeam = Math.min(targetGamesPerTeam, numTeams - 1);

  const teamGameCounts: { [team: string]: number } = {};
  teams.forEach((team) => (teamGameCounts[team] = 0));

  const playedMatches: Set<string> = new Set();
  const teamTimeSlots: {
    [team: string]: { startTime: string; endTime: string }[];
  } = {};
  teams.forEach((team) => (teamTimeSlots[team] = []));

  let gameIndex = 0;
  let currentTime = times.startTime;

  while (teams.some((team) => teamGameCounts[team] < targetGamesPerTeam)) {
    let availableTeams = [...teams];
    let courtIndex = 1;

    while (courtIndex <= courts && availableTeams.length >= 2) {
      let gameScheduled = false;

      for (let i = 0; i < availableTeams.length; i++) {
        for (let j = i + 1; j < availableTeams.length; j++) {
          const team1 = availableTeams[i];
          const team2 = availableTeams[j];

          if (
            teamGameCounts[team1] < targetGamesPerTeam &&
            teamGameCounts[team2] < targetGamesPerTeam
          ) {
            const matchKey = [team1, team2].sort().join("-");

            if (!playedMatches.has(matchKey)) {
              const endTime = calculateEndTime(currentTime, times.gameLength);

              if (
                !teamTimeSlots[team1].some(
                  (slot) =>
                    slot.startTime < endTime && slot.endTime > currentTime
                ) &&
                !teamTimeSlots[team2].some(
                  (slot) =>
                    slot.startTime < endTime && slot.endTime > currentTime
                )
              ) {
                games.push({
                  team1,
                  team2,
                  court: courtIndex,
                  startTime: currentTime,
                  endTime: endTime,
                  round: Math.floor(gameIndex / courts) + 1,
                });

                teamGameCounts[team1]++;
                teamGameCounts[team2]++;
                playedMatches.add(matchKey);

                teamTimeSlots[team1].push({
                  startTime: currentTime,
                  endTime: endTime,
                });
                teamTimeSlots[team2].push({
                  startTime: currentTime,
                  endTime: endTime,
                });

                availableTeams = availableTeams.filter(
                  (team) => team !== team1 && team !== team2
                );
                gameScheduled = true;
                gameIndex++;
                break;
              }
            }
          }
        }
        if (gameScheduled) {
          break;
        }
      }
      courtIndex++;
    }
    currentTime = calculateNextStartTime(
      calculateEndTime(currentTime, times.gameLength),
      times.timeBetweenGames
    );
  }

  return games;
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
