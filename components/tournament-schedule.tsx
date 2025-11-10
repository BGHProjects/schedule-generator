"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, ArrowLeft, X, Plus, Minus } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { generatePDF } from "@/lib/pdf-generator";
import { validateGameMove, getValidationError } from "@/lib/schedule-validator";
import type { TournamentData, Game } from "@/types/tournament";
import { Input } from "./ui/input";

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

interface TournamentScheduleProps {
  data: TournamentData;
  schedule: Game[];
  onScheduleUpdate: (schedule: Game[]) => void;
  onBack: () => void;
}

export function TournamentSchedule({
  data,
  schedule,
  onScheduleUpdate,
  onBack,
}: TournamentScheduleProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [filterType, setFilterType] = useState<"team" | "ref">("team");
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    gameId: string | null;
  }>({
    open: false,
    gameId: null,
  });
  const [isExportScheduleOpen, setIsExportScheduleOpen] =
    useState<boolean>(false);
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([]);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const [tournamentStartDate, setTournamentStartDate] = useState<
    string | undefined
  >(undefined);
  const [tournamentEndDate, setTournamentEndDate] = useState<
    string | undefined
  >(undefined);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle regular game movement only
    const gameId = draggableId;
    const gameToMove = schedule.find((g) => g.id === gameId);
    if (!gameToMove) return;

    const [sourceCourtStr, sourceTimeSlot] = source.droppableId.split("-");
    const [destCourtStr, destTimeSlot] = destination.droppableId.split("-");
    const sourceCourt = Number.parseInt(sourceCourtStr);
    const destCourt = Number.parseInt(destCourtStr);

    if (sourceCourt === destCourt && sourceTimeSlot === destTimeSlot) return;

    const gameInDestination = schedule.find(
      (g) =>
        g.court === destCourt && g.timeSlot === destTimeSlot && g.id !== gameId
    );

    const validationResult = validateGameMove(
      gameToMove,
      destCourt,
      destTimeSlot,
      schedule,
      data
    );
    if (!validationResult.isValid) {
      // If it's a ref conflict, try to auto-assign a new ref
      if (
        validationResult.reason === "ref_team_conflict" ||
        validationResult.reason === "ref_busy"
      ) {
        const team1 = data.teams.find((t) => t.id === gameToMove.team1Id);
        const team2 = data.teams.find((t) => t.id === gameToMove.team2Id);

        if (team1 && team2) {
          const busyRefIds = new Set(
            schedule
              .filter((g) => g.timeSlot === destTimeSlot && g.id !== gameId)
              .map((g) => g.refId)
              .filter(Boolean) as string[]
          );

          const availableRefs = data.refs.filter(
            (ref) =>
              ref.teamId !== team1.id &&
              ref.teamId !== team2.id &&
              !busyRefIds.has(ref.id)
          );

          // Auto-assign new ref and proceed with move
          const newRefId =
            availableRefs.length > 0 ? availableRefs[0].id : null;

          const updatedSchedule = schedule.map((game) => {
            if (game.id === gameId) {
              return {
                ...game,
                court: destCourt,
                timeSlot: destTimeSlot,
                refId: newRefId,
              };
            }
            if (gameInDestination && game.id === gameInDestination.id) {
              return { ...game, court: sourceCourt, timeSlot: sourceTimeSlot };
            }
            return game;
          });

          onScheduleUpdate(updatedSchedule);
          return;
        }
      }

      setErrorDialog({
        open: true,
        message: getValidationError(
          validationResult.reason || "unknown",
          validationResult.details
        ),
      });
      return;
    }

    // Perform the swap/move
    const updatedSchedule = schedule.map((game) => {
      if (game.id === gameId) {
        return { ...game, court: destCourt, timeSlot: destTimeSlot };
      }
      if (gameInDestination && game.id === gameInDestination.id) {
        return { ...game, court: sourceCourt, timeSlot: sourceTimeSlot };
      }
      return game;
    });

    onScheduleUpdate(updatedSchedule);
  };

  const handleRefChange = (gameId: string, refId: string | null) => {
    const updatedSchedule = schedule.map((game) =>
      game.id === gameId ? { ...game, refId: refId || null } : game
    );
    onScheduleUpdate(updatedSchedule);
  };

  const handleDeleteGame = (gameId: string) => {
    setDeleteDialog({ open: true, gameId });
  };

  const confirmDeleteGame = () => {
    if (deleteDialog.gameId) {
      const updatedSchedule = schedule.filter(
        (game) => game.id !== deleteDialog.gameId
      );
      onScheduleUpdate(updatedSchedule);
    }
    setDeleteDialog({ open: false, gameId: null });
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const totalMinutes = timeToMinutes(time) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const addTimeSlot = (referenceTime: string, direction: "above" | "below") => {
    const slotDuration = data.gameDuration + data.breakBetweenGames;
    const newTime =
      direction === "above"
        ? addMinutes(referenceTime, -slotDuration)
        : addMinutes(referenceTime, slotDuration);

    setCustomTimeSlots((prev) => [...prev, newTime]);
  };

  const deleteTimeSlot = (timeSlot: string) => {
    // Move all games from this time slot to be deleted
    const gamesInSlot = schedule.filter((game) => game.timeSlot === timeSlot);
    if (gamesInSlot.length > 0) {
      const updatedSchedule = schedule.filter(
        (game) => game.timeSlot !== timeSlot
      );
      onScheduleUpdate(updatedSchedule);
    }

    // Remove from custom time slots
    setCustomTimeSlots((prev) => prev.filter((slot) => slot !== timeSlot));
  };

  const getAllTimeSlots = () => {
    // Get ALL time slots that have ever been used, including when games are moved
    const gameTimeSlots = new Set<string>();

    // Add current game time slots
    schedule.forEach((game) => gameTimeSlots.add(game.timeSlot));

    // Add break time slots
    data.tournamentBreaks.forEach((breakItem) => {
      gameTimeSlots.add(breakItem.startTime);
    });

    // Add custom time slots
    customTimeSlots.forEach((slot) => gameTimeSlots.add(slot));

    // Convert to sorted array
    const allSlots = Array.from(gameTimeSlots).sort();

    // Ensure we have a minimum set of time slots even if schedule is empty
    if (allSlots.length === 0) {
      const startTime = data.startTime;
      allSlots.push(startTime);
    }

    // Add placeholder slots to ensure consistent grid
    const minSlots = Math.max(allSlots.length, 8); // Minimum 8 time slots
    while (allSlots.length < minSlots) {
      const lastTime = allSlots[allSlots.length - 1];
      const nextTime = addMinutes(
        lastTime,
        data.gameDuration + data.breakBetweenGames
      );
      allSlots.push(nextTime);
    }

    return allSlots;
  };

  const getFilteredSchedule = () => {
    if (selectedFilter === "all") return schedule;

    if (filterType === "team") {
      return schedule.filter(
        (game) =>
          game.team1Id === selectedFilter || game.team2Id === selectedFilter
      );
    } else {
      // Filter by referee
      if (selectedFilter === "no-ref") {
        return schedule.filter((game) => !game.refId);
      }
      return schedule.filter((game) => game.refId === selectedFilter);
    }
  };

  const getTeamById = (id: string) => {
    return data.teams.find((team) => team.id === id);
  };

  const getRefById = (id: string) => {
    return data.refs.find((ref) => ref.id === id);
  };

  const getAvailableRefs = (game: Game) => {
    const team1 = getTeamById(game.team1Id);
    const team2 = getTeamById(game.team2Id);

    return data.refs.filter(
      (ref) => ref.teamId !== team1?.id && ref.teamId !== team2?.id
    );
  };

  const exportToPDF = () => {
    const filteredSchedule = getFilteredSchedule();
    let exportName = "All Teams";

    if (selectedFilter !== "all") {
      if (filterType === "team") {
        exportName = getTeamById(selectedFilter)?.name || "Unknown Team";
      } else {
        if (selectedFilter === "no-ref") {
          exportName = "Games Without Referee";
        } else {
          const ref = getRefById(selectedFilter);
          exportName = `Referee: ${ref?.name || "Unknown Referee"}`;
        }
      }
    }

    generatePDF(filteredSchedule, data, exportName, getAllTimeSlots());
  };

  const timeSlots = getAllTimeSlots();
  const filteredSchedule = getFilteredSchedule();

  // Get all referees who have at least one game assigned
  const refsWithGames = data.refs.filter((ref) =>
    schedule.some((game) => game.refId === ref.id)
  );

  const exportTournamentData = async () => {
    if (!tournamentStartDate || !tournamentEndDate) {
      console.error("There needs to be a tournament date to export the data");
      return;
    }

    const result = {
      name: data.tournamentName,
      startDate: tournamentStartDate,
      endDate: tournamentEndDate,
      teams: data.teams.map((team) => ({
        name: team.name,
        pool: team.pool,
      })),
      games: schedule.map((game) => {
        const team1 = data.teams.find((t) => t.id === game.team1Id);
        const team2 = data.teams.find((t) => t.id === game.team2Id);

        return {
          time: game.timeSlot,
          blueTeam: team1 ? team1.name : "Unknown Team",
          redTeam: team2 ? team2.name : "Unknown Team",
        };
      }),
    };

    const json = JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      alert("Tournament data copied to clipboard! ✅");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy data 😕");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Summary
          </Button>
          <h2 className="text-2xl font-bold">
            {data.tournamentName} - Schedule
          </h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-x-0 md:space-x-4 space-y-4 md:space-y-0 items-center justify-start">
        <Button onClick={exportToPDF}>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
        <Button
          onClick={() => setIsExportScheduleOpen(true)}
          className="bg-blue-500"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Schedule Data
        </Button>
      </div>

      {/* Filter Type Selector */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium">Filter by:</label>
        <Select
          value={filterType}
          onValueChange={(value: "team" | "ref") => {
            setFilterType(value);
            setSelectedFilter("all");
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Team</SelectItem>
            <SelectItem value="ref">Referee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
        <TabsList className="flex overflow-x-auto whitespace-nowrap mb-4 w-full justify-start">
          <TabsTrigger value="all" className="flex-shrink-0">
            All {filterType === "team" ? "Teams" : "Games"}
          </TabsTrigger>

          {filterType === "team" ? (
            // Team tabs
            data.teams.map((team) => (
              <TabsTrigger
                key={team.id}
                value={team.id}
                className="flex-shrink-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  {team.name}
                </div>
              </TabsTrigger>
            ))
          ) : (
            // Referee tabs
            <>
              {refsWithGames.map((ref) => (
                <TabsTrigger
                  key={ref.id}
                  value={ref.id}
                  className="flex-shrink-0"
                >
                  {ref.name}
                  {ref.teamId && (
                    <span className="text-xs opacity-70 ml-1">
                      ({data.teams.find((t) => t.id === ref.teamId)?.name})
                    </span>
                  )}
                </TabsTrigger>
              ))}
              <TabsTrigger value="no-ref" className="flex-shrink-0">
                No Referee
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={selectedFilter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Schedule -{" "}
                {selectedFilter === "all"
                  ? `All ${filterType === "team" ? "Teams" : "Games"}`
                  : filterType === "team"
                  ? getTeamById(selectedFilter)?.name
                  : selectedFilter === "no-ref"
                  ? "Games Without Referee"
                  : `Referee: ${getRefById(selectedFilter)?.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={scheduleRef}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 bg-gray-50 font-semibold">
                            Time
                          </th>
                          <th className="border p-2 bg-gray-50 font-semibold w-16">
                            Actions
                          </th>
                          {Array.from({ length: data.courts }, (_, i) => (
                            <th
                              key={i}
                              className="border p-2 bg-gray-50 font-semibold"
                            >
                              Court {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((timeSlot, index) => {
                          const isBreakTime = isTimeSlotDuringBreaks(
                            timeSlot,
                            data.tournamentBreaks,
                            data.gameDuration
                          );
                          const hasGamesInSlot = filteredSchedule.some(
                            (game) => game.timeSlot === timeSlot
                          );

                          // If this is a break time slot, show a special break row
                          if (isBreakTime && !hasGamesInSlot) {
                            const breakInfo = data.tournamentBreaks.find(
                              (b) => b.startTime === timeSlot
                            );
                            return (
                              <tr
                                key={`break-${timeSlot}`}
                                className="bg-gray-800"
                              >
                                <td className="border p-2 font-bold text-white bg-gray-900">
                                  {timeSlot}
                                </td>
                                <td className="border p-1 bg-gray-900">
                                  {/* No action buttons for break rows */}
                                </td>
                                <td
                                  className="border p-4 text-center font-bold text-white bg-gray-800"
                                  colSpan={data.courts}
                                >
                                  🛑 TOURNAMENT BREAK ({breakInfo?.duration}{" "}
                                  minutes)
                                </td>
                              </tr>
                            );
                          }

                          // ALWAYS show regular game row - even if no games
                          return (
                            <tr key={timeSlot}>
                              <td className="border p-2 font-medium bg-gray-50">
                                {timeSlot}
                              </td>
                              <td className="border p-1 bg-gray-50">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200"
                                    onClick={() =>
                                      addTimeSlot(timeSlot, "above")
                                    }
                                    title="Add time slot above"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                                    onClick={() => deleteTimeSlot(timeSlot)}
                                    title="Delete this time slot"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-200"
                                    onClick={() =>
                                      addTimeSlot(timeSlot, "below")
                                    }
                                    title="Add time slot below"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                              {Array.from(
                                { length: data.courts },
                                (_, courtIndex) => {
                                  const court = courtIndex + 1;
                                  const gamesInSlot = filteredSchedule.filter(
                                    (game) =>
                                      game.timeSlot === timeSlot &&
                                      game.court === court
                                  );

                                  return (
                                    <td
                                      key={court}
                                      className="border p-1 h-20 align-top"
                                    >
                                      <Droppable
                                        droppableId={`${court}-${timeSlot}`}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`h-full min-h-[60px] rounded p-1 ${
                                              snapshot.isDraggingOver
                                                ? "bg-blue-50"
                                                : ""
                                            }`}
                                          >
                                            {gamesInSlot.length === 0 ? (
                                              // Show placeholder that can accept drops
                                              <div className="h-full min-h-[60px] flex items-center justify-center text-gray-300 text-xs border-2 border-dashed border-gray-200 rounded">
                                                Drop game here
                                              </div>
                                            ) : (
                                              gamesInSlot.map((game, index) => {
                                                const team1 = getTeamById(
                                                  game.team1Id
                                                );
                                                const team2 = getTeamById(
                                                  game.team2Id
                                                );
                                                const availableRefs =
                                                  getAvailableRefs(game);

                                                return (
                                                  <Draggable
                                                    key={game.id}
                                                    draggableId={game.id}
                                                    index={index}
                                                  >
                                                    {(provided, snapshot) => (
                                                      <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`p-2 rounded border text-xs cursor-move relative ${
                                                          snapshot.isDragging
                                                            ? "shadow-lg bg-white"
                                                            : "bg-white hover:shadow-md"
                                                        }`}
                                                        style={{
                                                          ...provided
                                                            .draggableProps
                                                            .style,
                                                          borderLeft: `4px solid ${
                                                            team1?.color ||
                                                            "#ccc"
                                                          }`,
                                                        }}
                                                      >
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="absolute top-0 right-0 h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteGame(
                                                              game.id
                                                            );
                                                          }}
                                                        >
                                                          <X className="w-3 h-3" />
                                                        </Button>
                                                        <div className="font-medium mb-1 flex items-center gap-1 pr-4">
                                                          <span
                                                            className="inline-block w-3 h-3 rounded-full border border-gray-300"
                                                            style={{
                                                              backgroundColor:
                                                                team1?.color,
                                                            }}
                                                            title={team1?.name}
                                                          />
                                                          <span className="text-xs">
                                                            {team1?.name}
                                                          </span>
                                                          <span className="mx-1">
                                                            vs
                                                          </span>
                                                          <span
                                                            className="inline-block w-3 h-3 rounded-full border border-gray-300"
                                                            style={{
                                                              backgroundColor:
                                                                team2?.color,
                                                            }}
                                                            title={team2?.name}
                                                          />
                                                          <span className="text-xs">
                                                            {team2?.name}
                                                          </span>
                                                        </div>
                                                        {game.pool && (
                                                          <div className="text-gray-500 mb-1">
                                                            Pool {game.pool}
                                                          </div>
                                                        )}
                                                        <div className="mb-1">
                                                          <Select
                                                            value={
                                                              game.refId ||
                                                              "none"
                                                            }
                                                            onValueChange={(
                                                              value
                                                            ) =>
                                                              handleRefChange(
                                                                game.id,
                                                                value === "none"
                                                                  ? null
                                                                  : value
                                                              )
                                                            }
                                                          >
                                                            <SelectTrigger className="h-6 text-xs">
                                                              <SelectValue placeholder="No ref" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                              <SelectItem value="none">
                                                                No referee
                                                              </SelectItem>
                                                              {availableRefs.map(
                                                                (ref) => (
                                                                  <SelectItem
                                                                    key={ref.id}
                                                                    value={
                                                                      ref.id
                                                                    }
                                                                  >
                                                                    {ref.name}
                                                                  </SelectItem>
                                                                )
                                                              )}
                                                            </SelectContent>
                                                          </Select>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </Draggable>
                                                );
                                              })
                                            )}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          );
                        })}

                        {/* End of Regulation Row */}
                        <tr className="bg-green-800">
                          <td className="border p-2 font-bold text-white bg-green-900">
                            END
                          </td>
                          <td className="border p-1 bg-green-900"></td>
                          <td
                            className="border p-4 text-center font-bold text-white bg-green-800"
                            colSpan={data.courts}
                          >
                            🏁 END OF REGULATION
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </DragDropContext>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Dialog */}
      <Dialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invalid Move</DialogTitle>
            <DialogDescription className="text-left whitespace-pre-line">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              onClick={() => setErrorDialog({ ...errorDialog, open: false })}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this game? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, gameId: null })}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteGame}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Schedule Dialog */}
      <Dialog
        open={isExportScheduleOpen}
        onOpenChange={() => setIsExportScheduleOpen(!isExportScheduleOpen)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Schedule</DialogTitle>
            <DialogDescription>
              <div className="flex flex-col space-y-4 mt-4">
                <div className="flex flex-col space-y-1">
                  <div className="font-bold">Name:</div>
                  <div className="font-normal">{data.tournamentName}</div>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="font-bold">Number of Games:</div>
                  <div className="font-normal">{schedule.length}</div>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="font-bold">Start Time:</div>
                  <div className="font-normal">{data.startTime}</div>
                </div>
                <div className="flex flex-row items-center justify-start space-x-2">
                  <div className="flex flex-col space-y-1">
                    <div className="font-bold">Start Date:</div>
                    <Input
                      id="date"
                      type="date"
                      value={tournamentStartDate}
                      onChange={(e) => setTournamentStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="font-bold">End Date:</div>
                    <Input
                      id="date"
                      type="date"
                      value={tournamentEndDate}
                      onChange={(e) => setTournamentEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExportScheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={exportTournamentData}>
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Team Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.teams.map((team) => (
              <Badge
                key={team.id}
                variant="secondary"
                className="flex items-center gap-2"
                style={{
                  backgroundColor: team.color + "20",
                  borderColor: team.color,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                {team.name}
                {team.pool && (
                  <span className="text-xs opacity-70">(Pool {team.pool})</span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
