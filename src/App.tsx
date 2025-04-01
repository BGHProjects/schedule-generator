import React, { useEffect, useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { PlaceholdersAndVanishInput } from "./components/ui/placeholders-and-vanish-input";
import { Vortex } from "./components/ui/vortex";
import { PlaceholdersInput } from "./components/ui/placeholders-input";
import { AppState, Game, InputState, ScheduleInput } from "./lib/types/types";
import { generateSchedule } from "./lib/helpers/generateSchedule";
import ScheduleTable from "./components/ScheduleTable";
import { exportScheduleToPdf } from "./lib/helpers/exportScheduleToPDF";

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LandingPage);
  const [inputState, setInputState] = useState<InputState>(InputState.Teams);
  const [scheduleInput, setScheduleInput] = useState<ScheduleInput>({
    teams: [],
    times: { startTime: "", gameLength: 0, timeBetweenGames: 0 },
    courts: 1,
    gamesPerTeam: 1,
  });
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [currentTeamInput, setCurrentTeamInput] = useState("");
  const [currentStartTimeInput, setCurrentStartTimeInput] = useState("09:00");
  const [currentGameLength, setCurrentGameLength] = useState(30);
  const [currentTimeBetweenGames, setCurrentTimeBetweenGames] = useState(5);
  const [numberOfCourts, setNumberOfCourts] = useState(1);
  const [numberOfGamesPerTeam, setNumberOfGamesPerTeam] = useState(1);

  useEffect(() => {
    if (inputState === InputState.Completed) {
      const generatedSchedule = generateSchedule(scheduleInput);
      console.log("\n\t scheduleInput", scheduleInput);
      console.log("\n\t generatedSchedule", generatedSchedule);
      setSchedule(generatedSchedule);
      setAppState(AppState.Generated);
    }
  }, [inputState]);

  // Handles resetting all the values of the schedule input
  const resetScheduleInput = () => {
    setScheduleInput({
      teams: [],
      times: { startTime: "", gameLength: 0, timeBetweenGames: 0 },
      courts: 1,
      gamesPerTeam: 1,
    });
  };

  // Handles beginning a new schedule generation
  const handleStartScheduleGenerationInput = () => {
    resetScheduleInput();
    setInputState(InputState.Teams);
    setAppState(AppState.Inputting); // Ready app to receive inputs
  };

  // Handles the user exiting the process
  const handleExit = () => {
    setAppState(AppState.LandingPage); // Send user back to landing page
    resetScheduleInput();
  };

  const teamInputPlaceholders = [
    "Enter Team Name Here",
    "This is where you enter the name of the team",
  ];

  const handleChangeTeamInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTeamInput(e.target.value);
  };
  const onSubmitTeamInput = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedScheduleInput = scheduleInput;
    updatedScheduleInput.teams = [...scheduleInput.teams, currentTeamInput];
    setScheduleInput(updatedScheduleInput); // Set the new full input state
    setCurrentTeamInput(""); // Reset form input
  };

  const startTimePlaceholders = [
    "Enter the start time in HH:MM 24 hour format",
    "e.g. 18:00 for a 6pm start",
  ];

  const handleStartTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStartTimeInput(e.target.value);
  };

  const gameLengthPlaceholders = [
    "Enter the length of the game in minutes",
    'e.g. "30" for a thirty minute game',
  ];

  const handleGameLengthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGameLength(Number(e.target.value));
  };

  const timeBetweenGamePlaceholders = [
    "Enter the time between games in minutes",
    'e.g. "5" for five minutes between games',
  ];

  const handleTimeBetweenGamesInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentTimeBetweenGames(Number(e.target.value));
  };

  const onSubmitTimes = () => {
    const updatedScheduleInput = scheduleInput;
    updatedScheduleInput.times = {
      startTime: currentStartTimeInput,
      gameLength: currentGameLength,
      timeBetweenGames: currentTimeBetweenGames,
    };
    setScheduleInput(updatedScheduleInput);
    setCurrentStartTimeInput("");
    setCurrentGameLength(0);
    setCurrentTimeBetweenGames(0);
    setInputState(InputState.Courts);
  };

  const courtNumberPlaceholders = ["Enter the number of courts available"];

  const handleCourtNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberOfCourts(Number(e.target.value));
  };

  const onSubmitCourts = () => {
    const updatedScheduleInput = scheduleInput;
    updatedScheduleInput.courts = numberOfCourts;
    setScheduleInput(updatedScheduleInput);
    setNumberOfCourts(0);
    setInputState(InputState.Rounds);
  };

  const roundNumberPlaceholders = ["Enter the number of rounds"];

  const handleRoundInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberOfGamesPerTeam(Number(e.target.value));
  };

  const onSubmitRounds = () => {
    const updatedScheduleInput = scheduleInput;
    updatedScheduleInput.gamesPerTeam = numberOfGamesPerTeam;
    setScheduleInput(updatedScheduleInput);
    setNumberOfGamesPerTeam(0);
    setInputState(InputState.Completed);
  };

  const onClickFill = () => {
    const updatedScheduleInput = scheduleInput;
    updatedScheduleInput.gamesPerTeam = "FILL";
    setScheduleInput(updatedScheduleInput);
    setNumberOfGamesPerTeam(0);
    setInputState(InputState.Completed);
  };

  const handleExportToPDF = () => {
    exportScheduleToPdf(schedule);
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
                      placeholders={teamInputPlaceholders}
                      onChange={handleChangeTeamInput}
                      onSubmit={onSubmitTeamInput}
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
                      <text
                        className="text-white text-lg max-w-xl mt-1 text-center pl-2"
                        key={team}
                      >
                        {team}
                      </text>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {inputState === InputState.Times && (
              <div className="flex flex-col space-y-4 max-w-[450px] w-[100%]">
                <h3 className="text-white text-xl md:text-6xl font-bold text-center">
                  Times
                </h3>
                <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                  Start Time
                </p>
                <PlaceholdersInput
                  placeholders={startTimePlaceholders}
                  onChange={handleStartTimeInput}
                />
                <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                  Game Length
                </p>
                <PlaceholdersInput
                  placeholders={gameLengthPlaceholders}
                  onChange={handleGameLengthInput}
                />
                <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                  Time Between Games
                </p>
                <PlaceholdersInput
                  placeholders={timeBetweenGamePlaceholders}
                  onChange={handleTimeBetweenGamesInput}
                />
                <Button className="h-12 mb-4" onClick={onSubmitTimes}>
                  <text className="text-white font-bold text-xl px-12 py-8">
                    NEXT
                  </text>
                </Button>
              </div>
            )}

            {inputState === InputState.Courts && (
              <div className="flex flex-col space-y-4 max-w-[450px] w-[100%]">
                <h3 className="text-white text-xl md:text-6xl font-bold text-center">
                  Courts
                </h3>
                <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                  How many courts are available to play on?
                </p>
                <PlaceholdersInput
                  placeholders={courtNumberPlaceholders}
                  onChange={handleCourtNumberInput}
                />
                <Button className="h-12 mb-4" onClick={onSubmitCourts}>
                  <text className="text-white font-bold text-xl px-12 py-8">
                    NEXT
                  </text>
                </Button>
              </div>
            )}

            {inputState === InputState.Rounds && (
              <div className="flex flex-col space-y-4 max-w-[450px] w-[100%]">
                <h3 className="text-white text-xl md:text-6xl font-bold text-center">
                  Games per team
                </h3>
                <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
                  How many games will each team play?
                </p>
                <PlaceholdersInput
                  placeholders={roundNumberPlaceholders}
                  onChange={handleRoundInput}
                />
                <Button className="h-12 mb-4" onClick={onClickFill}>
                  <text className="text-white font-bold text-xl px-12 py-8">
                    Fill
                  </text>
                </Button>
                <Button className="h-12 mb-4" onClick={onSubmitRounds}>
                  <text className="text-white font-bold text-xl px-12 py-8">
                    NEXT
                  </text>
                </Button>
              </div>
            )}
            <Button className="h-12" onClick={handleExit}>
              <text className="text-white font-bold text-xl px-12 py-8">
                EXIT
              </text>
            </Button>
          </>
        )}

        {appState === AppState.Generated && (
          <div className="flex flex-col space-y-4">
            <h3 className="text-white text-xl md:text-6xl font-bold text-center">
              Here is your schedule
            </h3>

            <ScheduleTable games={schedule} />

            <Button className="h-12" onClick={handleExportToPDF}>
              <text className="text-white font-bold text-xl px-12 py-8">
                EXPORT TO PDF
              </text>
            </Button>

            <Button className="h-12" onClick={handleExit}>
              <text className="text-white font-bold text-xl px-12 py-8">
                EXIT
              </text>
            </Button>
          </div>
        )}
      </Vortex>
    </div>
  );
}

export default App;
