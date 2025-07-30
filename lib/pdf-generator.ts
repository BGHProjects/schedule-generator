import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Game, TournamentData } from "@/types/tournament";

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        Number.parseInt(result[1], 16),
        Number.parseInt(result[2], 16),
        Number.parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

function isTimeSlotDuringBreaks(
  timeSlot: string,
  tournamentBreaks: any[],
  gameDuration: number
): boolean {
  return tournamentBreaks.some((breakItem) => {
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const slotTime = timeToMinutes(timeSlot);
    const breakStart = timeToMinutes(breakItem.startTime);
    const breakEnd = breakStart + breakItem.duration;

    const gameEnd = slotTime + gameDuration;

    return (
      (slotTime >= breakStart && slotTime < breakEnd) ||
      (gameEnd > breakStart && gameEnd <= breakEnd) ||
      (slotTime <= breakStart && gameEnd >= breakEnd)
    );
  });
}

export function generatePDF(
  schedule: Game[],
  data: TournamentData,
  teamName: string,
  allTimeSlots: string[]
) {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation

  // Title
  doc.setFontSize(16);
  doc.text(data.tournamentName, 20, 20);

  doc.setFontSize(12);
  doc.text(`Schedule for: ${teamName}`, 20, 30);

  // Use the provided time slots
  const timeSlots = allTimeSlots.sort();

  // Create table structure matching the web display
  const tableData: any[] = [];
  const gamesByTimeSlotAndCourt: { [key: string]: Game } = {};

  // Index games by time slot and court for easy lookup
  schedule.forEach((game) => {
    const key = `${game.timeSlot}-${game.court}`;
    gamesByTimeSlotAndCourt[key] = game;
  });

  timeSlots.forEach((timeSlot) => {
    const isBreakTime = isTimeSlotDuringBreaks(
      timeSlot,
      data.tournamentBreaks,
      data.gameDuration
    );
    const hasGamesInSlot = schedule.some((game) => game.timeSlot === timeSlot);

    // If this is a break time with no games, create a break row
    if (isBreakTime && !hasGamesInSlot) {
      const breakInfo = data.tournamentBreaks.find(
        (b) => b.startTime === timeSlot
      );
      tableData.push([
        {
          content: timeSlot,
          styles: {
            fillColor: [64, 64, 64],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
        },
        {
          content: `🛑 TOURNAMENT BREAK (${breakInfo?.duration} minutes)`,
          colSpan: data.courts,
          styles: {
            fillColor: [64, 64, 64],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
        },
      ]);
      return;
    }

    // Regular game row
    const rowData: any[] = [
      {
        content: timeSlot,
        styles: { fillColor: [249, 250, 251], fontStyle: "bold" },
      },
    ];

    // Add each court column
    for (let court = 1; court <= data.courts; court++) {
      const gameKey = `${timeSlot}-${court}`;
      const gameOnCourt = gamesByTimeSlotAndCourt[gameKey];

      if (gameOnCourt) {
        const team1 = data.teams.find((t) => t.id === gameOnCourt.team1Id);
        const team2 = data.teams.find((t) => t.id === gameOnCourt.team2Id);
        const ref = gameOnCourt.refId
          ? data.refs.find((r) => r.id === gameOnCourt.refId)
          : null;

        // Create content with teams displayed horizontally
        let cellContent = `${team1?.name} vs ${team2?.name}`;
        if (gameOnCourt.pool) {
          cellContent += `\nPool ${gameOnCourt.pool}`;
        }
        if (ref) {
          cellContent += `\nRef: ${ref.name}`;
        }

        rowData.push({
          content: cellContent,
          styles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          // Store team info for custom text rendering
          team1Color: team1?.color,
          team2Color: team2?.color,
          team1Name: team1?.name,
          team2Name: team2?.name,
          gameId: gameOnCourt.id,
          poolInfo: gameOnCourt.pool ? `Pool ${gameOnCourt.pool}` : null,
          refInfo: ref ? `Ref: ${ref.name}` : null,
        });
      } else {
        rowData.push({
          content: "",
          styles: {
            fillColor: [255, 255, 255],
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
        });
      }
    }

    tableData.push(rowData);
  });

  // Add End of Regulation row
  tableData.push([
    {
      content: "END",
      styles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    },
    {
      content: "🏁 END OF REGULATION",
      colSpan: data.courts,
      styles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
    },
  ]);

  // Create headers
  const headers = [
    {
      content: "Time",
      styles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    },
  ];
  for (let i = 1; i <= data.courts; i++) {
    headers.push({
      content: `Court ${i}`,
      styles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
    });
  }

  // Generate table with custom cell rendering
  autoTable(doc, {
    head: [headers as any],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: "top",
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
      minCellHeight: 24,
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Time column
    },
    theme: "grid",
    didDrawCell: (hookData: any) => {
      // Custom text rendering with colored team names - horizontal layout
      if (hookData.section === "body" && hookData.column.index > 0) {
        const rowData = tableData[hookData.row.index];
        if (!rowData || hookData.column.index >= rowData.length) return;

        const cellData = rowData[hookData.column.index];

        // Check if this cell has team data for custom rendering
        if (
          cellData &&
          cellData.team1Color &&
          cellData.team2Color &&
          cellData.team1Name &&
          cellData.team2Name
        ) {
          const cellX = hookData.cell.x;
          const cellY = hookData.cell.y;

          // Clear the default text (we'll draw our own)
          doc.setFillColor(255, 255, 255);
          doc.rect(
            cellX,
            cellY,
            hookData.cell.width,
            hookData.cell.height,
            "F"
          );

          // Set font
          doc.setFontSize(8);

          // Calculate text widths for proper positioning
          doc.setFont("helvetica", "bold");
          const team1Width = doc.getTextWidth(cellData.team1Name);

          doc.setFont("helvetica", "normal");
          const vsWidth = doc.getTextWidth(" vs ");

          // Draw team1 name in bold and colored
          const [r1, g1, b1] = hexToRgb(cellData.team1Color);
          doc.setTextColor(r1, g1, b1);
          doc.setFont("helvetica", "bold");
          doc.text(cellData.team1Name, cellX + 2, cellY + 6);

          // Draw "vs" in normal black text
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          doc.text(" vs ", cellX + 2 + team1Width, cellY + 6);

          // Draw team2 name in bold and colored
          const [r2, g2, b2] = hexToRgb(cellData.team2Color);
          doc.setTextColor(r2, g2, b2);
          doc.setFont("helvetica", "bold");
          doc.text(
            cellData.team2Name,
            cellX + 2 + team1Width + vsWidth,
            cellY + 6
          );

          // Draw pool info if exists (on second line)
          if (cellData.poolInfo) {
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            doc.text(cellData.poolInfo, cellX + 2, cellY + 14);
          }

          // Draw ref info if exists (on third line, or second if no pool)
          if (cellData.refInfo) {
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            const yOffset = cellData.poolInfo ? 22 : 14;
            doc.text(cellData.refInfo, cellX + 2, cellY + yOffset);
          }

          // Reset text color and font for other cells
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
        }
      }
    },
  });

  // Save the PDF
  doc.save(
    `${data.tournamentName
      .toLowerCase()
      .replace(/\s+/g, "-")}-schedule-${teamName
      .toLowerCase()
      .replace(/\s+/g, "-")}.pdf`
  );
}
