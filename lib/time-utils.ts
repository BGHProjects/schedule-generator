export function isTimeSlotDuringBreak(timeSlot: string, tournamentBreak: any, gameDuration: number): boolean {
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const slotTime = timeToMinutes(timeSlot)
  const breakStart = timeToMinutes(tournamentBreak.startTime)
  const breakEnd = breakStart + tournamentBreak.duration

  const gameEnd = slotTime + gameDuration

  return (
    (slotTime >= breakStart && slotTime < breakEnd) ||
    (gameEnd > breakStart && gameEnd <= breakEnd) ||
    (slotTime <= breakStart && gameEnd >= breakEnd)
  )
}
