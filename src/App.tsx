import React, { useContext } from "react";
import "./App.css";
import CourtsInput from "./components/CourtsInput";
import RoundsInput from "./components/RoundsInput";
import TeamsInput from "./components/TeamsInput";
import TimesInput from "./components/TimesInput";
import { Button } from "./components/ui/button";
import { Vortex } from "./components/ui/vortex";
import { AppContext } from "./lib/contexts/AppContext";
import { AppState } from "./lib/types/types";
import { ScheduleTabs } from "./components/ScheduleTabs";

const App = () => {
  const { handleStartScheduleGenerationInput, appState, setAppState } =
    useContext(AppContext);

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
            <TeamsInput />
            <TimesInput />
            <CourtsInput />
            <RoundsInput />
            <Button
              className="h-12"
              onClick={() => setAppState(AppState.LandingPage)}
            >
              <text className="text-white font-bold text-xl px-12 py-8">
                EXIT
              </text>
            </Button>
          </>
        )}

        {appState === AppState.Generated && <ScheduleTabs />}
      </Vortex>
    </div>
  );
};

export default App;
