import React, { useContext, useState } from "react";
import { AppContext } from "../lib/contexts/AppContext";
import { InputState } from "../lib/types/types";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";

const CourtsInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext) || {};
  const [numberOfCourts, setNumberOfCourts] = useState(1);

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

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
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-xl md:text-3xl">Courts</CardTitle>
          <CardDescription>
            How many courts are available to play on?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="timeBetweenGames"
                placeholder="Enter the number of courts available"
                onChange={handleCourtNumberInput}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Button
        className="w-full h-12 mt-12"
        onClick={onSubmitCourts}
        disabled={!numberOfCourts}
      >
        <span className="text-white font-bold text-xl">NEXT</span>
      </Button>
    </div>
  );
};

export default CourtsInput;
