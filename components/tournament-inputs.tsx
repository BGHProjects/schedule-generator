"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit2, Plus } from "lucide-react"
import type { TournamentData, Team, Ref, TournamentBreak } from "@/types/tournament"

interface TournamentInputsProps {
  onComplete: (data: TournamentData) => void
  initialData?: TournamentData | null
}

export function TournamentInputs({ onComplete, initialData }: TournamentInputsProps) {
  const [pools, setPools] = useState(2)
  const [courts, setCourts] = useState(4)
  const [teams, setTeams] = useState<Team[]>([])
  const [refs, setRefs] = useState<Ref[]>([])
  const [startTime, setStartTime] = useState("09:00")
  const [gameDuration, setGameDuration] = useState(20)
  const [breakBetweenGames, setBreakBetweenGames] = useState(5)
  const [tournamentBreaks, setTournamentBreaks] = useState<TournamentBreak[]>([])
  const [tournamentName, setTournamentName] = useState("")

  // Team input states
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamPool, setNewTeamPool] = useState<number>(1)
  const [editingTeam, setEditingTeam] = useState<string | null>(null)

  // Ref input states
  const [newRefName, setNewRefName] = useState("")
  const [newRefTeam, setNewRefTeam] = useState<string>("")
  const [editingRef, setEditingRef] = useState<string | null>(null)

  // Break input states
  const [breakStartTime, setBreakStartTime] = useState("")
  const [breakDuration, setBreakDuration] = useState(30)

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setTournamentName(initialData.tournamentName || "")
      setPools(initialData.pools)
      setCourts(initialData.courts)
      setTeams(initialData.teams)
      setRefs(initialData.refs)
      setStartTime(initialData.startTime)
      setGameDuration(initialData.gameDuration)
      setBreakBetweenGames(initialData.breakBetweenGames)
      setTournamentBreaks(initialData.tournamentBreaks || [])
    }
  }, [initialData])

  const addTeam = () => {
    if (!newTeamName.trim()) return
    if (teams.some((team) => team.name.toLowerCase() === newTeamName.toLowerCase())) {
      alert("Team name already exists!")
      return
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName.trim(),
      pool: pools > 1 ? newTeamPool : null,
      color: generateTeamColor(),
    }

    setTeams([...teams, newTeam])
    setNewTeamName("")
    setNewTeamPool(1)
  }

  const removeTeam = (id: string) => {
    setTeams(teams.filter((team) => team.id !== id))
  }

  const editTeam = (id: string) => {
    const team = teams.find((t) => t.id === id)
    if (team) {
      setNewTeamName(team.name)
      setNewTeamPool(team.pool || 1)
      setEditingTeam(id)
    }
  }

  const saveTeamEdit = () => {
    if (!editingTeam || !newTeamName.trim()) return

    setTeams(
      teams.map((team) =>
        team.id === editingTeam ? { ...team, name: newTeamName.trim(), pool: pools > 1 ? newTeamPool : null } : team,
      ),
    )

    setEditingTeam(null)
    setNewTeamName("")
    setNewTeamPool(1)
  }

  const addRef = () => {
    if (!newRefName.trim()) return

    const newRef: Ref = {
      id: Date.now().toString(),
      name: newRefName.trim(),
      teamId: newRefTeam || null,
    }

    setRefs([...refs, newRef])
    setNewRefName("")
    setNewRefTeam("")
  }

  const removeRef = (id: string) => {
    setRefs(refs.filter((ref) => ref.id !== id))
  }

  const editRef = (id: string) => {
    const ref = refs.find((r) => r.id === id)
    if (ref) {
      setNewRefName(ref.name)
      setNewRefTeam(ref.teamId || "")
      setEditingRef(id)
    }
  }

  const saveRefEdit = () => {
    if (!editingRef || !newRefName.trim()) return

    setRefs(
      refs.map((ref) =>
        ref.id === editingRef ? { ...ref, name: newRefName.trim(), teamId: newRefTeam || null } : ref,
      ),
    )

    setEditingRef(null)
    setNewRefName("")
    setNewRefTeam("")
  }

  const addTournamentBreak = () => {
    if (!breakStartTime) return

    const newBreak: TournamentBreak = {
      id: Date.now().toString(),
      startTime: breakStartTime,
      duration: breakDuration,
    }

    setTournamentBreaks([...tournamentBreaks, newBreak])
    setBreakStartTime("")
    setBreakDuration(30)
  }

  const removeTournamentBreak = (id: string) => {
    setTournamentBreaks(tournamentBreaks.filter((b) => b.id !== id))
  }

  const generateTeamColor = () => {
    const colors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f43f5e",
      "#84cc16",
    ]
    return colors[teams.length % colors.length]
  }

  const handleSubmit = () => {
    if (teams.length < 2) {
      alert("Please add at least 2 teams")
      return
    }

    const data: TournamentData = {
      tournamentName: tournamentName.trim() || "Tournament",
      pools,
      courts,
      teams,
      refs,
      startTime,
      gameDuration,
      breakBetweenGames,
      tournamentBreaks,
    }

    onComplete(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tournament Name */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Information</CardTitle>
          <CardDescription>Basic tournament details</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="tournamentName">Tournament Name</Label>
            <Input
              id="tournamentName"
              placeholder="Enter tournament name"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Settings</CardTitle>
          <CardDescription>Configure the basic tournament parameters</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pools">Number of Pools</Label>
            <Input
              id="pools"
              type="number"
              min="1"
              value={pools}
              onChange={(e) => setPools(Number.parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <Label htmlFor="courts">Number of Courts</Label>
            <Input
              id="courts"
              type="number"
              min="1"
              value={courts}
              onChange={(e) => setCourts(Number.parseInt(e.target.value) || 1)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>Add teams to the tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (editingTeam ? saveTeamEdit() : addTeam())}
            />
            {pools > 1 && (
              <Select value={newTeamPool.toString()} onValueChange={(value) => setNewTeamPool(Number.parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: pools }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Pool {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={editingTeam ? saveTeamEdit : addTeam}>
              {editingTeam ? "Save" : <Plus className="w-4 h-4" />}
            </Button>
            {editingTeam && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTeam(null)
                  setNewTeamName("")
                  setNewTeamPool(1)
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <Badge
                key={team.id}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
                style={{ backgroundColor: team.color + "20", borderColor: team.color }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                {team.name}
                {team.pool && <span className="text-xs opacity-70">(Pool {team.pool})</span>}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => editTeam(team.id)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTeam(team.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Time Settings</CardTitle>
          <CardDescription>Configure game timing</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="gameDuration">Game Duration (minutes)</Label>
            <Input
              id="gameDuration"
              type="number"
              min="1"
              value={gameDuration}
              onChange={(e) => setGameDuration(Number.parseInt(e.target.value) || 20)}
            />
          </div>
          <div>
            <Label htmlFor="breakBetweenGames">Break Between Games (minutes)</Label>
            <Input
              id="breakBetweenGames"
              type="number"
              min="0"
              value={breakBetweenGames}
              onChange={(e) => setBreakBetweenGames(Number.parseInt(e.target.value) || 5)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tournament Breaks */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Breaks (Optional)</CardTitle>
          <CardDescription>Add breaks during the tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              type="time"
              placeholder="Break start time"
              value={breakStartTime}
              onChange={(e) => setBreakStartTime(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number.parseInt(e.target.value) || 30)}
            />
            <Button onClick={addTournamentBreak}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tournamentBreaks.map((breakItem) => (
              <Badge key={breakItem.id} variant="outline" className="flex items-center gap-2">
                Break at {breakItem.startTime} for {breakItem.duration} minutes
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTournamentBreak(breakItem.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referees */}
      <Card>
        <CardHeader>
          <CardTitle>Referees (Optional)</CardTitle>
          <CardDescription>Add referees for the tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Referee name"
              value={newRefName}
              onChange={(e) => setNewRefName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (editingRef ? saveRefEdit() : addRef())}
            />
            <Select value={newRefTeam || "default"} onValueChange={setNewRefTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select team (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">No team affiliation</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={editingRef ? saveRefEdit : addRef}>
              {editingRef ? "Save" : <Plus className="w-4 h-4" />}
            </Button>
            {editingRef && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingRef(null)
                  setNewRefName("")
                  setNewRefTeam("")
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {refs.map((ref) => (
              <Badge key={ref.id} variant="outline" className="flex items-center gap-2">
                {ref.name}
                {ref.teamId && (
                  <span className="text-xs opacity-70">({teams.find((t) => t.id === ref.teamId)?.name})</span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => editRef(ref.id)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeRef(ref.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg">
          Continue to Summary
        </Button>
      </div>
    </div>
  )
}
