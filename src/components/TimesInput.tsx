import { AppContext } from "@/lib/contexts/AppContext";
import { Clock } from "lucide-react";
import React, { useCallback, useContext, useState } from "react";
import { InputState } from "../lib/types/types";
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
import { convertTo24Hour } from "@/lib/helpers/convertTo24Hour";

const TimesInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext);
  const [currentStartTimeInput, setCurrentStartTimeInput] = useState("");
  const [currentGameLength, setCurrentGameLength] = useState(0);
  const [currentTimeBetweenGames, setCurrentTimeBetweenGames] = useState(0);

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

  const handleGameLengthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentGameLength(Number(e.target.value));
  };

  const handleTimeBetweenGamesInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    setCurrentTimeBetweenGames(Number(e.target.value));
  };

  const handleStartTimeChange = useCallback(
    (newValue: string) => {
      if (newValue !== currentStartTimeInput) {
        setCurrentStartTimeInput(newValue);
      }
    },
    [currentStartTimeInput]
  ); // Depend on current value to compare

  const onSubmitTimes = () => {
    const updatedScheduleInput = {
      ...scheduleInput,
      times: {
        startTime: convertTo24Hour(currentStartTimeInput),
        gameLength: currentGameLength,
        timeBetweenGames: currentTimeBetweenGames,
      },
    };
    setScheduleInput(updatedScheduleInput);
    setInputState(InputState.Courts);
  };

  const isInvalid =
    !currentStartTimeInput || // Empty string
    currentGameLength <= 0 || // Zero or negative
    currentTimeBetweenGames < 0; // Negative (0 is okay for no break)

  if (inputState !== InputState.Times) return null;

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-xl md:text-3xl">Times</CardTitle>
          <CardDescription>Enter the relevant time information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="unavailableBefore"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                <span>Start Time</span>
              </Label>

              <TimeInput
                id="startTime"
                value={currentStartTimeInput}
                onChange={handleStartTimeChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gameLength">Game Length</Label>
              <Input
                id="gameLength"
                placeholder="Enter the length of the game in minutes (e.g. 20 for twenty minute games)"
                value={currentGameLength}
                onChange={handleGameLengthInput}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeBetweenGames">Time Between Games</Label>
              <Input
                id="timeBetweenGames"
                placeholder="Enter the time between games in minutes (e.g. 5 for five minutes between games)"
                value={currentTimeBetweenGames}
                onChange={handleTimeBetweenGamesInput}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Button
        className="w-full h-12 mt-12"
        onClick={onSubmitTimes}
        disabled={isInvalid}
      >
        <span className="text-white font-bold text-xl">NEXT</span>
      </Button>
    </div>
  );
};

export default TimesInput;
