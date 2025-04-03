import React from "react";
import { Button } from "@/components/ui/button"; // Adjust path as needed
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Shadcn Tabs
import { Game } from "@/lib/types/types";
import { groupGamesByTeam } from "@/lib/helpers/groupGamesByTeam";
import ScheduleTable from "./ScheduleTable";
import { colours } from "@/lib/consts/colors";

// ScheduleTabs Component using shadcn Tabs
export const ScheduleTabs: React.FC<{
  schedule: Game[];
  handleExportToPDF: () => void; // Changed from onExportToPDF
  handleExit: () => void; // Changed from onExit
}> = ({ schedule, handleExportToPDF, handleExit }) => {
  const scheduleByTeam = groupGamesByTeam(schedule); // Generate team-specific schedules
  const teams = Object.keys(scheduleByTeam); // List of unique team names

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-white text-xl md:text-6xl font-bold text-center mb-12">
        Here is your schedule
      </h3>

      <Tabs defaultValue="FULL" className="w-full">
        {/* Tab Triggers */}
        <TabsList className="flex flex-wrap justify-center gap-2">
          {/* FULL Tab */}
          <TabsTrigger
            value="FULL"
            className="bg-gray-500 text-white font-bold px-4 py-2 rounded-md cursor-pointer data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            FULL
          </TabsTrigger>

          {/* Team-specific Tabs with dynamic colors */}
          {teams.map((team, index) => (
            <TabsTrigger
              key={team}
              value={team}
              style={{
                backgroundColor: colours[index] || "#ccc", // Use team's color or fallback to grey
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              className="px-4 py-2 rounded-md data-[state=active]:brightness-90"
            >
              {team}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="FULL">
          <ScheduleTable games={schedule} />
        </TabsContent>
        {teams.map((team) => (
          <TabsContent key={team} value={team}>
            <ScheduleTable games={scheduleByTeam[team]} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Buttons */}
      <Button className="h-12" onClick={handleExportToPDF}>
        <span className="text-white font-bold text-xl px-12 py-8">
          EXPORT TO PDF
        </span>
      </Button>
      <Button className="h-12" onClick={handleExit}>
        <span className="text-white font-bold text-xl px-12 py-8">EXIT</span>
      </Button>
    </div>
  );
};
