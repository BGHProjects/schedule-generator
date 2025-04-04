import React, { createContext, ReactNode, useState, useEffect } from "react";
import { exportScheduleToPdf } from "../helpers/exportScheduleToPDF";
import { generateSchedule } from "../helpers/generateSchedule";
import { AppState, InputState, ScheduleInput, Game } from "../types/types";
import { groupGamesByTeam } from "../helpers/groupGamesByTeam";

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
  scheduleByTeam: Record<string, { games: Game[]; colour: string }>;
  currentlyViewedSchedule: Game[];
  setCurrentlyViewedSchedule: React.Dispatch<React.SetStateAction<Game[]>>;
}

export const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [appState, setAppState] = useState<AppState>(AppState.LandingPage);
  const [inputState, setInputState] = useState<InputState>(InputState.Teams);
  const [scheduleInput, setScheduleInput] = useState<ScheduleInput>({
    teams: [],
    times: { startTime: "", gameLength: 0, timeBetweenGames: 0 },
    courts: 0,
    gamesPerTeam: 0,
  });
  const [schedule, setSchedule] = useState<Game[]>([]);
  const [scheduleByTeam, setScheduleByTeam] = useState<
    Record<string, { games: Game[]; colour: string }>
  >({});
  const [currentlyViewedSchedule, setCurrentlyViewedSchedule] = useState<
    Game[]
  >([]);

  useEffect(() => {
    if (inputState === InputState.Completed) {
      const generatedSchedule = generateSchedule(scheduleInput);
      const scheduleGroupedByTeam = groupGamesByTeam(generatedSchedule);
      setScheduleByTeam(scheduleGroupedByTeam);

      setSchedule(generatedSchedule);
      setAppState(AppState.Generated);
    }
  }, [inputState, scheduleInput]);

  const resetScheduleInput = () => {
    setScheduleInput({
      teams: [],
      times: { startTime: "", gameLength: 0, timeBetweenGames: 0 },
      courts: 0,
      gamesPerTeam: 0,
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
    exportScheduleToPdf(currentlyViewedSchedule);
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
    scheduleByTeam,
    currentlyViewedSchedule,
    setCurrentlyViewedSchedule,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
