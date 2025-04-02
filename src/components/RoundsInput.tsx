import React, { useContext, useState } from "react";
import { Button } from "./ui/button";
import { PlaceholdersInput } from "./ui/placeholders-input";
import { InputState } from "../lib/types/types";
import { AppContext } from "@/lib/contexts/AppContext";

const RoundsInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext) || {};
  const [numberOfGamesPerTeam, setNumberOfGamesPerTeam] = useState(1);

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

  const roundNumberPlaceholders = ["Enter the number of rounds"];

  const handleRoundInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberOfGamesPerTeam(Number(e.target.value));
  };

  const onSubmitRounds = () => {
    const updatedScheduleInput = {
      ...scheduleInput,
      gamesPerTeam: numberOfGamesPerTeam,
    };
    setScheduleInput(updatedScheduleInput);
    setInputState(InputState.Completed);
  };

  const onClickFill = () => {
    const updatedScheduleInput = { ...scheduleInput, gamesPerTeam: "FILL" };
    setScheduleInput(updatedScheduleInput);
    setInputState(InputState.Completed);
  };

  if (inputState !== InputState.Rounds) return null;

  return (
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
        <text className="text-white font-bold text-xl px-12 py-8">Fill</text>
      </Button>
      <Button className="h-12 mb-4" onClick={onSubmitRounds}>
        <text className="text-white font-bold text-xl px-12 py-8">NEXT</text>
      </Button>
    </div>
  );
};

export default RoundsInput;
