import React, { useContext, useState } from "react";
import { Button } from "./ui/button";
import { PlaceholdersInput } from "./ui/placeholders-input";
import { InputState } from "../lib/types/types";
import { AppContext } from "../lib/contexts/AppContext";

const CourtsInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext) || {};
  const [numberOfCourts, setNumberOfCourts] = useState(1);

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

  const courtNumberPlaceholders = ["Enter the number of courts available"];

  const handleCourtNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberOfCourts(Number(e.target.value));
  };

  const onSubmitCourts = () => {
    const updatedScheduleInput = { ...scheduleInput, courts: numberOfCourts };
    setScheduleInput(updatedScheduleInput);
    setInputState(InputState.Rounds);
  };

  if (inputState !== InputState.Courts) return null;

  return (
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
        <text className="text-white font-bold text-xl px-12 py-8">NEXT</text>
      </Button>
    </div>
  );
};

export default CourtsInput;
