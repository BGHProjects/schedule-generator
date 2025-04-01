import jsPDF from "jspdf";
import { Game } from "../types/types";

export const exportScheduleToPdf = (games: Game[]) => {
  if (!games || games.length === 0) {
    console.error("No games to export.");
    return;
  }

  const uniqueCourts = Array.from(
    new Set(games.map((game) => game.court))
  ).sort((a, b) => a - b);
  const uniqueTimes = Array.from(
    new Set(games.map((game) => game.startTime))
  ).sort();

  const scheduleMap: {
    [time: string]: {
      [court: number]: { team1: string; team2: string } | null;
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

  const teams = Array.from(
    new Set(games.flatMap((game) => [game.team1, game.team2]))
  );
  const colors = [
    "#dc2626", // red-700
    "#2563eb", // blue-700
    "#16a34a", // green-700
    "#facc15", // yellow-700
    "#9333ea", // purple-700
    "#4f46e5", // indigo-700
    "#ec4899", // pink-700
    "#14b8a6", // teal-700
    "#f97316", // orange-700
    "#84cc16", // lime-700
    "#06b6d4", // cyan-700
    "#d946ef", // fuchsia-700
    "#f43f5e", // rose-700
    "#8b5cf6", // violet-700
    "#38bdf8", // sky-700
    "#10b981", // emerald-700
    "#f59e0b", // amber-700
    "#52525b", // zinc-700
    "#475569", // slate-700
    "#57534e", // stone-700
  ];
  const teamColors: { [team: string]: string } = {};
  teams.forEach((team, index) => {
    teamColors[team] = colors[index % colors.length];
  });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const colWidth = (pageWidth - 2 * margin) / (uniqueCourts.length + 1); // +1 for time column
  const rowHeight = 35; // Increased row height for padding
  let y = margin;

  // Headers
  doc.setFontSize(12);
  doc.text("Time", margin, y + 10);
  uniqueCourts.forEach((court, index) => {
    doc.text(`Court ${court}`, margin + (index + 1) * colWidth, y + 10);
  });
  y += rowHeight;

  // Rows
  uniqueTimes.forEach((time) => {
    doc.setFontSize(10);
    doc.text(time, margin, y + rowHeight / 2); // Center vertically in time cell
    uniqueCourts.forEach((court, index) => {
      const game = scheduleMap[time][court];
      if (game) {
        const team1Color = teamColors[game.team1];
        const team2Color = teamColors[game.team2];

        // Team 1 box
        doc.setFillColor(team1Color);
        doc.roundedRect(
          margin + (index + 1) * colWidth + 4,
          y + 4,
          colWidth - 8,
          rowHeight / 2 - 8,
          3,
          3,
          "F"
        );
        doc.setTextColor("#ffffff");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(
          game.team1,
          margin + (index + 1) * colWidth + colWidth / 2,
          y + rowHeight / 4,
          { align: "center", baseline: "middle" }
        );

        // Team 2 box
        doc.setFillColor(team2Color);
        doc.roundedRect(
          margin + (index + 1) * colWidth + 4,
          y + rowHeight / 2 + 4,
          colWidth - 8,
          rowHeight / 2 - 8,
          3,
          3,
          "F"
        );
        doc.setTextColor("#ffffff");
        doc.setFont("helvetica", "bold");
        doc.text(
          game.team2,
          margin + (index + 1) * colWidth + colWidth / 2,
          y + rowHeight * 0.75,
          { align: "center", baseline: "middle" }
        );

        doc.setTextColor("#000000"); // set text color back to black
        doc.setFont("helvetica", "normal"); // reset font weight
      }
    });
    y += rowHeight;
  });

  doc.save("schedule.pdf");
};
