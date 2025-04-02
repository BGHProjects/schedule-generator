import React, { createContext, ReactNode, useState, useEffect } from "react";
import { exportScheduleToPdf } from "../helpers/exportScheduleToPDF";
import { generateSchedule } from "../helpers/generateSchedule";
import { AppState, InputState, ScheduleInput, Game } from "../types/types";

interface AppContextProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  inputState: InputState;
  setInputState: React.Dispatch<React.SetStateAction<InputState>>;
  scheduleInput: ScheduleInput;
  setScheduleInput: React.Dispatch<React.SetStateAction<ScheduleInput>>;
  schedule: Game[];
  setSchedule: React.Dispatch<React.SetStateAction<Game[]>>;
  handleStartScheduleGenerationInput: () => void;
  handleExit: () => void;
  handleExportToPDF: () => void;
}

export const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [appState, setAppState] = useState<AppState>(AppState.LandingPage);
  const [inputState, setInputState] = useState<InputState>(InputState.Teams);
  const [scheduleInput, setScheduleInput] = useState<ScheduleInput>({
    teams: [],
    times: { startTime: "09:00", gameLength: 30, timeBetweenGames: 5 },
    courts: 1,
    gamesPerTeam: 1,
  });
  const [schedule, setSchedule] = useState<Game[]>([]);

  useEffect(() => {
    if (inputState === InputState.Completed) {
      const generatedSchedule = generateSchedule(scheduleInput);
      setSchedule(generatedSchedule);
      setAppState(AppState.Generated);
    }
  }, [inputState, scheduleInput]);

  const resetScheduleInput = () => {
    setScheduleInput({
      teams: [],
      times: { startTime: "09:00", gameLength: 30, timeBetweenGames: 5 },
      courts: 1,
      gamesPerTeam: 1,
    });
  };

  const handleStartScheduleGenerationInput = () => {
    resetScheduleInput();
    setInputState(InputState.Teams);
    setAppState(AppState.Inputting);
  };

  const handleExit = () => {
    setInputState(InputState.Teams);
    setAppState(AppState.LandingPage);
    resetScheduleInput();
  };

  const handleExportToPDF = () => {
    exportScheduleToPdf(schedule);
  };

  const contextValue: AppContextProps = {
    appState,
    setAppState,
    inputState,
    setInputState,
    scheduleInput,
    setScheduleInput,
    schedule,
    setSchedule,
    handleStartScheduleGenerationInput,
    handleExit,
    handleExportToPDF,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
