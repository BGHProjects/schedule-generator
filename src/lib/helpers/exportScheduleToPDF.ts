import jsPDF from "jspdf";
import { Game } from "../types/types";
import { colours } from "../consts/colors";

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

  const teamColors: { [team: string]: string } = {};
  teams.forEach((team, index) => {
    teamColors[team] = colours[index % colours.length];
  });

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const timeColWidth = 30;
  const courtColWidth =
    (pageWidth - 2 * margin - timeColWidth) / uniqueCourts.length;
  const rowHeight = 25;
  const headerHeight = 15; // Space for headers
  const maxY = pageHeight - margin; // Usable height per page
  let y = margin + headerHeight;

  // Function to draw headers
  const drawHeaders = () => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TIME", margin + timeColWidth / 2, margin + 10, {
      align: "center",
    });
    uniqueCourts.forEach((court, index) => {
      doc.text(
        `COURT ${court}`.toUpperCase(),
        margin + timeColWidth + index * courtColWidth + courtColWidth / 2,
        margin + 10,
        { align: "center" }
      );
    });
  };

  // Draw headers on the first page
  drawHeaders();

  // Rows
  uniqueTimes.forEach((time, rowIndex) => {
    // Check if the next row will exceed the page height
    if (y + rowHeight > maxY) {
      doc.addPage();
      y = margin + headerHeight; // Reset y for new page
      drawHeaders(); // Redraw headers on new page
    }

    // Grey background with rounded corners for odd rows
    if (rowIndex % 2 !== 0) {
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, rowHeight, 3, 3, "F");
    }

    // Time text: Centered and bold
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(time, margin + timeColWidth / 2, y + rowHeight / 2, {
      align: "center",
      baseline: "middle",
    });
    doc.setFont("helvetica", "normal");

    uniqueCourts.forEach((court, index) => {
      const game = scheduleMap[time][court];
      if (game) {
        const team1Color = teamColors[game.team1];
        const team2Color = teamColors[game.team2];

        // Team 1 box
        doc.setFillColor(team1Color);
        doc.roundedRect(
          margin + timeColWidth + index * courtColWidth + 4,
          y + 2,
          courtColWidth - 8,
          rowHeight / 2 - 2,
          3,
          3,
          "F"
        );
        doc.setTextColor("#ffffff");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(
          game.team1,
          margin + timeColWidth + index * courtColWidth + courtColWidth / 2,
          y + rowHeight / 4 + 1,
          { align: "center", baseline: "middle" }
        );

        // Team 2 box
        doc.setFillColor(team2Color);
        doc.roundedRect(
          margin + timeColWidth + index * courtColWidth + 4,
          y + rowHeight / 2 + 1,
          courtColWidth - 8,
          rowHeight / 2 - 2,
          3,
          3,
          "F"
        );
        doc.setTextColor("#ffffff");
        doc.setFont("helvetica", "bold");
        doc.text(
          game.team2,
          margin + timeColWidth + index * courtColWidth + courtColWidth / 2,
          y + rowHeight * 0.75,
          { align: "center", baseline: "middle" }
        );

        doc.setTextColor("#000000");
        doc.setFont("helvetica", "normal");
      }
    });
    y += rowHeight;
  });

  doc.save("schedule.pdf");
};
