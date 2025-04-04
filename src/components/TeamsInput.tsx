import { AppContext } from "@/lib/contexts/AppContext";
import { Clock, X } from "lucide-react";
import React, { useContext, useState } from "react";
import { InputState, Team } from "../lib/types/types";
import { TimeInput } from "./TimeInput";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { colours } from "@/lib/consts/colors";

const TeamsInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext) || {};
  const [currentTeamInput, setCurrentTeamInput] = useState("");
  const [unavailableBefore, setUnavailableBefore] = useState("");
  const [unavailableAfter, setUnavailableAfter] = useState("");
  const [error, setError] = useState<string | null>(null); // Optional: for feedback

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

  if (inputState !== InputState.Teams) return null;

  const handleChangeTeamInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTeamInput(e.target.value);
    setError(null); // Clear error on input change
  };

  const handleAddTeam = () => {
    if (!currentTeamInput.trim()) return;

    const teamExists = scheduleInput.teams.some(
      (team) =>
        team.name.toLowerCase() === currentTeamInput.trim().toLowerCase()
    );

    if (teamExists) {
      setError("This team name is already in use."); // Optional feedback
      return;
    }

    const colourIndex = scheduleInput.teams.length % colours.length;
    const teamColour = colours[colourIndex];

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: currentTeamInput,
      colour: teamColour,
      unavailableBefore: unavailableBefore || undefined,
      unavailableAfter: unavailableAfter || undefined,
    };

    const updatedScheduleInput = {
      ...scheduleInput,
      teams: [...scheduleInput.teams, newTeam],
    };
    setScheduleInput(updatedScheduleInput);
    setCurrentTeamInput("");
    setUnavailableBefore("");
    setUnavailableAfter("");
    setError(null);
  };

  const handleRemoveTeam = (id: string) => {
    const newTeams = scheduleInput.teams.filter((team) => team.id !== id);
    const updatedScheduleInput = {
      ...scheduleInput,
      teams: newTeams,
    };
    setScheduleInput(updatedScheduleInput);
  };

  return (
    <div className="container mx-auto py-10 align-center max-w-2xl">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-xl md:text-3xl">Teams</CardTitle>
          <CardDescription>
            Enter the teams that will be competing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>

              <Input
                id="teamName"
                placeholder="Enter team name"
                value={currentTeamInput}
                onChange={handleChangeTeamInput}
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="unavailableBefore"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />

                <span>Unavailable Before (Optional)</span>
              </Label>

              <TimeInput
                id="unavailableBefore"
                value={unavailableBefore}
                onChange={setUnavailableBefore}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="unavailableAfter"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />

                <span>Unavailable After (Optional)</span>
              </Label>

              <TimeInput
                id="unavailableAfter"
                value={unavailableAfter}
                onChange={setUnavailableAfter}
              />
            </div>

            <Button
              onClick={handleAddTeam}
              disabled={!currentTeamInput.trim()}
              className="w-full"
            >
              Add Team
            </Button>
          </div>

          {scheduleInput.teams.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Current Teams ({scheduleInput.teams.length})
                </h3>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {scheduleInput.teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{team.name}</p>

                        <div className="text-sm text-muted-foreground">
                          {team.unavailableBefore || team.unavailableAfter ? (
                            <div className="space-y-1">
                              {team.unavailableBefore && (
                                <p>
                                  Unavailable before: {team.unavailableBefore}
                                </p>
                              )}

                              {team.unavailableAfter && (
                                <p>
                                  Unavailable after: {team.unavailableAfter}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p>Available anytime</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveTeam(team.id)}
                      >
                        <X className="h-4 w-4" />

                        <span className="sr-only">Remove team</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Button
        onClick={() => setInputState(InputState.Times)}
        className="w-full h-12 mt-12"
        disabled={!scheduleInput.teams.length}
      >
        <span className="text-white font-bold text-xl">NEXT</span>
      </Button>
    </div>
  );
};

export default TeamsInput;
