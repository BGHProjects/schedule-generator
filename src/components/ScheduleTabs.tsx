import { Button } from "@/components/ui/button"; // Adjust path as needed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Shadcn Tabs
import { AppContext } from "@/lib/contexts/AppContext";
import { groupGamesByTeam } from "@/lib/helpers/groupGamesByTeam";
import React, { useContext } from "react";
import ScheduleTable from "./ScheduleTable";

// ScheduleTabs Component using shadcn Tabs
export const ScheduleTabs: React.FC = () => {
  const {
    schedule,
    handleExportToPDF,
    handleExit,
    setCurrentlyViewedSchedule,
  } = useContext(AppContext);
  const scheduleByTeam = groupGamesByTeam(schedule); // Generate team-specific schedules
  const teams = Object.keys(scheduleByTeam); // List of unique team names

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-white text-xl md:text-6xl font-bold text-center mb-12">
        Here is your schedule
      </h3>

      <Tabs defaultValue="FULL" className="w-full">
        {/* Tab Triggers */}
        <TabsList className="flex flex-wrap justify-center gap-2 w-full overflow-x-auto">
          {/* FULL Tab */}
          <TabsTrigger
            value="FULL"
            className="bg-gray-500 text-white font-bold px-4 py-2 rounded-md cursor-pointer data-[state=active]:bg-gray-700 data-[state=active]:text-white w-[15%]"
            onClick={() => setCurrentlyViewedSchedule(schedule)}
          >
            FULL
          </TabsTrigger>

          {/* Team-specific Tabs with dynamic colors */}
          {teams.map((team) => (
            <TabsTrigger
              key={team}
              value={team}
              style={{
                backgroundColor: scheduleByTeam[team].colour, // Use team's color or fallback to grey
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              className="px-4 py-2 rounded-md data-[state=active]:brightness-90 w-[15%]"
              onClick={() =>
                setCurrentlyViewedSchedule(scheduleByTeam[team].games)
              }
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
            <ScheduleTable games={scheduleByTeam[team].games} />
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
