import { useEffect, useState } from "react";
import "./App.css";
import { Vortex } from "./components/ui/vortex";
import { Button } from "./components/ui/button";
import React from "react";
import { PlaceholdersAndVanishInput } from "./components/ui/placeholders-and-vanish-input";

enum AppState {
  LandingPage = "LandingPage",
  Inputting = "Inputting",
  Generated = "Generated",
}

enum InputState {
  Teams = "Teams",
  Times = "Times",
  Courts = "Courts",
  Rounds = "Rounds",
}

interface ScheduleInput {
  teams: string[];
}

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LandingPage);
  const [inputState, setInputState] = useState<InputState>(InputState.Teams);
  const [scheduleInput, setScheduleInput] = useState<ScheduleInput>({
    teams: [],
  });
  const [currentTeamInput, setCurrentTeamInput] = useState("");

  // Handles resetting all the values of the schedule input
  const resetScheduleInput = () => {
    setScheduleInput({ teams: [] });
  };

  // Handles beginning a new schedule generation
  const handleStartScheduleGenerationInput = () => {
    resetScheduleInput();
    setAppState(AppState.Inputting); // Ready app to receive inputs
  };

  // Handles the user exiting the process
  const handleExit = () => {
    setAppState(AppState.LandingPage); // Send user back to landing page
    resetScheduleInput();
  };

  const placeholders = [
    "Enter Team Name Here",
    "This is where you enter the name of the team",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTeamInput(e.target.value);
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedScheduleInput = scheduleInput;
    updatedScheduleInput.teams = [...scheduleInput.teams, currentTeamInput];
    setScheduleInput(updatedScheduleInput); // Set the new full input state
    setCurrentTeamInput(""); // Reset form input
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      <Vortex
        backgroundColor="black"
        rangeY={800}
        particleCount={500}
        className="flex items-center flex-col justify-center px-2 md:px-10  py-4 w-full h-full"
        baseSpeed={0.2}
        baseHue={250}
      >
        {appState === AppState.LandingPage && (
          <>
            <h2 className="text-white text-2xl md:text-6xl font-bold text-center">
              Schedule Generator
            </h2>
            <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
              Generate your sports league schedule easier
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
              <Button
                className="h-12"
                onClick={handleStartScheduleGenerationInput}
              >
                <text className="text-white font-bold text-xl px-12 py-8">
                  BEGIN
                </text>
              </Button>
            </div>
          </>
        )}

        {appState === AppState.Inputting && (
          <>
            {inputState === InputState.Teams && (
              <div className="flex flex-col space-y-4">
                <h3 className="text-white text-xl md:text-6xl font-bold text-center">
                  Teams
                </h3>

                <div className="flex flex-row space-x-8">
                  <div className="flex flex-col space-y-4">
                    <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                      Enter the teams that will be competing
                    </p>
                    <PlaceholdersAndVanishInput
                      placeholders={placeholders}
                      onChange={handleChange}
                      onSubmit={onSubmit}
                    />
                    <Button
                      className="h-12 mb-4"
                      onClick={() => setInputState(InputState.Times)}
                    >
                      <text className="text-white font-bold text-xl px-12 py-8">
                        NEXT
                      </text>
                    </Button>
                  </div>
                  <div className="flex flex-col space-y-4">
                    <text className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                      Number of Teams: {scheduleInput.teams.length}
                    </text>
                    <text className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                      Current Teams:
                    </text>
                    {scheduleInput.teams.map((team) => (
                      <text className="text-white text-lg max-w-xl mt-1 text-center pl-2">
                        {team}
                      </text>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <Button className="h-12" onClick={handleExit}>
              <text className="text-white font-bold text-xl px-12 py-8">
                EXIT
              </text>
            </Button>
          </>
        )}
      </Vortex>
    </div>
  );
}

export default App;
