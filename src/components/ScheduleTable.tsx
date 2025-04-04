import { Game } from "@/lib/types/types";
import React from "react";

interface ScheduleTableProps {
  games: Game[];
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ games }) => {
  if (!games || games.length === 0) {
    return <p className="text-gray-300">No games to display.</p>;
  }

  const uniqueCourts = Array.from(
    new Set(games.map((game) => game.court))
  ).sort((a, b) => a - b);
  const uniqueTimes = Array.from(
    new Set(games.map((game) => game.startTime))
  ).sort();

  const scheduleMap: {
    [time: string]: {
      [court: number]: {
        team1: { name: string; colour: string };
        team2: { name: string; colour: string };
      } | null;
    };
  } = {};
  uniqueTimes.forEach((time) => {
    scheduleMap[time] = {};
  });

  games.forEach((game) => {
    scheduleMap[game.startTime][game.court] = {
      team1: game.team1,
      team2: game.team2,
    };
  });

  return (
    <div className="max-h-[75vh] overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-700 bg-gray-800 text-gray-300">
        <thead className="bg-gray-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Time
            </th>
            {uniqueCourts.map((court) => (
              <th
                key={court}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                Court {court}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {uniqueTimes.map((time) => (
            <tr key={time}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                {time}
              </td>
              {uniqueCourts.map((court) => {
                const game = scheduleMap[time][court];
                return (
                  <td
                    key={court}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {game && (
                      <div className="flex flex-col items-center">
                        <div
                          className={`p-1 rounded-md bg-[${game.team1.colour}] text-white font-bold mb-1 w-full text-center`}
                          style={{
                            backgroundColor: `${game.team1.colour}`,
                          }}
                        >
                          {game.team1.name}
                        </div>
                        <div
                          className={`p-1 rounded-md bg-[${game.team2.colour}] text-white font-bold w-full text-center`}
                          style={{
                            backgroundColor: `${game.team2.colour}`,
                          }}
                        >
                          {game.team2.name}
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
