"use client"

import { useState } from "react"
import { TournamentInputs } from "@/components/tournament-inputs"
import { TournamentSummary } from "@/components/tournament-summary"
import { TournamentSchedule } from "@/components/tournament-schedule"
import { generateSchedule } from "@/lib/schedule-generator"
import type { TournamentData, Game } from "@/types/tournament"

export default function TournamentScheduler() {
  const [step, setStep] = useState<"input" | "summary" | "schedule">("input")
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null)
  const [schedule, setSchedule] = useState<Game[]>([])

  const handleInputComplete = (data: TournamentData) => {
    setTournamentData(data)
    setStep("summary")
  }

  const handleSummaryConfirm = () => {
    if (tournamentData) {
      const generatedSchedule = generateSchedule(tournamentData)
      setSchedule(generatedSchedule)
      setStep("schedule")
    }
  }

  const handleBackToInputs = () => {
    setStep("input")
  }

  const handleBackToSummary = () => {
    setStep("summary")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Tournament Scheduler</h1>

        {step === "input" && <TournamentInputs onComplete={handleInputComplete} initialData={tournamentData} />}

        {step === "summary" && tournamentData && (
          <TournamentSummary
            data={tournamentData}
            onConfirm={handleSummaryConfirm}
            onBack={handleBackToInputs}
            onEdit={setTournamentData}
          />
        )}

        {step === "schedule" && tournamentData && (
          <TournamentSchedule
            data={tournamentData}
            schedule={schedule}
            onScheduleUpdate={setSchedule}
            onBack={handleBackToSummary}
          />
        )}
      </div>
    </div>
  )
}
