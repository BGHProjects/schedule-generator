import React, { useContext, useState } from "react";
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
import { AppContext } from "@/lib/contexts/AppContext";

const RoundsInput: React.FC = () => {
  const { scheduleInput, setScheduleInput, setInputState, inputState } =
    useContext(AppContext);
  const [numberOfGamesPerTeam, setNumberOfGamesPerTeam] = useState(1);

  if (!scheduleInput || !setScheduleInput || !setInputState) {
    return <div>Loading...</div>;
  }

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
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle className="text-xl md:text-3xl">Rounds</CardTitle>
          <CardDescription>How many games will each team play?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="timeBetweenGames"
                placeholder="Enter the number of rounds"
                onChange={handleRoundInput}
              />
            </div>
          </div>
          <Button className="w-full h-12 mt-12" onClick={onClickFill}>
            <span className="text-white font-bold text-xl">Fill</span>
          </Button>
        </CardContent>
      </Card>
      <Button
        className="w-full h-12 mt-12"
        onClick={onSubmitRounds}
        disabled={!numberOfGamesPerTeam}
      >
        <span className="text-white font-bold text-xl">NEXT</span>
      </Button>
    </div>
  );
};

export default RoundsInput;
