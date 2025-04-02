// import React, { useContext, useState } from "react";
// import { Button } from "./ui/button";
// import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input";
// import { InputState } from "../lib/types/types";
// import { AppContext } from "@/lib/contexts/AppContext";

// const TeamsInput: React.FC = () => {
//   const { scheduleInput, setScheduleInput, setInputState, inputState } =
//     useContext(AppContext) || {};
//   const [currentTeamInput, setCurrentTeamInput] = useState("");

//   if (!scheduleInput || !setScheduleInput || !setInputState) {
//     return <div>Loading...</div>;
//   }

//   const teamInputPlaceholders = [
//     "Enter Team Name Here",
//     "This is where you enter the name of the team",
//   ];

//   const handleChangeTeamInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setCurrentTeamInput(e.target.value);
//   };

//   const onSubmitTeamInput = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const updatedScheduleInput = {
//       ...scheduleInput,
//       teams: [...scheduleInput.teams, currentTeamInput],
//     };
//     setScheduleInput(updatedScheduleInput);
//     setCurrentTeamInput("");
//   };

//   if (inputState !== InputState.Teams) return null;

//   return (
//     <div className="flex flex-col space-y-4">
//       <h3 className="text-white text-xl md:text-6xl font-bold text-center">
//         Teams
//       </h3>
//       <div className="flex flex-row space-x-8">
//         <div className="flex flex-col space-y-4">
//           <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
//             Enter the teams that will be competing
//           </p>
//           <PlaceholdersAndVanishInput
//             placeholders={teamInputPlaceholders}
//             onChange={handleChangeTeamInput}
//             onSubmit={onSubmitTeamInput}
//           />
//           <Button
//             className="h-12 mb-4"
//             onClick={() => setInputState(InputState.Times)}
//           >
//             <text className="text-white font-bold text-xl px-12 py-8">
//               NEXT
//             </text>
//           </Button>
//         </div>
//         <div className="flex flex-col space-y-4">
//           <text className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
//             Number of Teams: {scheduleInput.teams.length}
//           </text>
//           <text className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
//             Current Teams:
//           </text>
//           {scheduleInput.teams.map((team) => (
//             <text
//               className="text-white text-lg max-w-xl mt-1 text-center pl-2"
//               key={team}
//             >
//               {team}
//             </text>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TeamsInput;

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

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: currentTeamInput,
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
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
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
