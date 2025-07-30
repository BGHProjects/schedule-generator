"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import type { TournamentData } from "@/types/tournament"

interface TournamentSummaryProps {
  data: TournamentData
  onConfirm: () => void
  onBack: () => void
  onEdit: (data: TournamentData) => void
}

export function TournamentSummary({ data, onConfirm, onBack, onEdit }: TournamentSummaryProps) {
  // Group teams by pool
  const teamsByPool = data.teams.reduce(
    (acc, team) => {
      const poolKey = team.pool || "no-pool"
      if (!acc[poolKey]) {
        acc[poolKey] = []
      }
      acc[poolKey].push(team)
      return acc
    },
    {} as Record<string, typeof data.teams>,
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Tournament Summary</h2>
        <p className="text-muted-foreground">Review your tournament settings before generating the schedule</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Tournament Settings
              <Button size="sm" variant="ghost" onClick={onBack}>
                <Edit className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Tournament Name:</span>
              <span className="font-medium">{data.tournamentName}</span>
            </div>
            <div className="flex justify-between">
              <span>Pools:</span>
              <span className="font-medium">{data.pools}</span>
            </div>
            <div className="flex justify-between">
              <span>Courts:</span>
              <span className="font-medium">{data.courts}</span>
            </div>
            <div className="flex justify-between">
              <span>Start Time:</span>
              <span className="font-medium">{data.startTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Game Duration:</span>
              <span className="font-medium">{data.gameDuration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Break Between Games:</span>
              <span className="font-medium">{data.breakBetweenGames} minutes</span>
            </div>
          </CardContent>
        </Card>

        {/* Teams by Pool */}
        <Card>
          <CardHeader>
            <CardTitle>Teams ({data.teams.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.pools === 1 ? (
              <div className="flex flex-wrap gap-2">
                {data.teams.map((team) => (
                  <Badge
                    key={team.id}
                    variant="secondary"
                    className="flex items-center gap-2"
                    style={{ backgroundColor: team.color + "20", borderColor: team.color }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </Badge>
                ))}
              </div>
            ) : (
              Object.entries(teamsByPool).map(([poolKey, teams]) => (
                <div key={poolKey}>
                  <h4 className="font-medium mb-2">{poolKey === "no-pool" ? "No Pool" : `Pool ${poolKey}`}</h4>
                  <div className="flex flex-wrap gap-2">
                    {teams.map((team) => (
                      <Badge
                        key={team.id}
                        variant="secondary"
                        className="flex items-center gap-2"
                        style={{ backgroundColor: team.color + "20", borderColor: team.color }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                        {team.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tournament Breaks */}
        {data.tournamentBreaks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tournament Breaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.tournamentBreaks.map((breakItem) => (
                  <div key={breakItem.id} className="flex justify-between">
                    <span>Break at {breakItem.startTime}:</span>
                    <span className="font-medium">{breakItem.duration} minutes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referees */}
        {data.refs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Referees ({data.refs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.refs.map((ref) => (
                  <Badge key={ref.id} variant="outline">
                    {ref.name}
                    {ref.teamId && (
                      <span className="text-xs opacity-70 ml-1">
                        ({data.teams.find((t) => t.id === ref.teamId)?.name})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Edit
        </Button>
        <Button onClick={onConfirm} size="lg">
          Generate Schedule
        </Button>
      </div>
    </div>
  )
}
