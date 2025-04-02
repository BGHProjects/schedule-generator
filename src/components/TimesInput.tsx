import React, { useContext, useState } from "react";
import { Button } from "./ui/button";
import { PlaceholdersInput } from "./ui/placeholders-input";
import { InputState } from "../lib/types/types";
import { AppContext } from "@/lib/contexts/AppContext";

const TimesInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext);
  const [currentStartTimeInput, setCurrentStartTimeInput] = useState("09:00");
  const [currentGameLength, setCurrentGameLength] = useState(30);
  const [currentTimeBetweenGames, setCurrentTimeBetweenGames] = useState(5);

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

  const startTimePlaceholders = [
    "Enter the start time in HH:MM 24 hour format",
    "e.g. 18:00 for a 6pm start",
  ];

  const gameLengthPlaceholders = [
    "Enter the length of the game in minutes",
    'e.g. "30" for a thirty minute game',
  ];

  const timeBetweenGamePlaceholders = [
    "Enter the time between games in minutes",
    'e.g. "5" for five minutes between games',
  ];

  const handleStartTimeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentStartTimeInput(e.target.value);
  };

  const handleGameLengthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGameLength(Number(e.target.value));
  };

  const handleTimeBetweenGamesInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCurrentTimeBetweenGames(Number(e.target.value));
  };

  const onSubmitTimes = () => {
    const updatedScheduleInput = {
      ...scheduleInput,
      times: {
        startTime: currentStartTimeInput,
        gameLength: currentGameLength,
        timeBetweenGames: currentTimeBetweenGames,
      },
    };
    setScheduleInput(updatedScheduleInput);
    setInputState(InputState.Courts);
  };

  if (inputState !== InputState.Times) return null;

  return (
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
        <text className="text-white font-bold text-xl px-12 py-8">NEXT</text>
      </Button>
    </div>
  );
};

export default TimesInput;
