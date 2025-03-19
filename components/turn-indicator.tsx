"use client"

import { Progress } from "@/components/ui/progress"

interface TurnIndicatorProps {
  currentPlayer: string
  timeLeft: number
  totalTime: number
}

export function TurnIndicator({ currentPlayer, timeLeft, totalTime }: TurnIndicatorProps) {
  const progressPercentage = (timeLeft / totalTime) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{currentPlayer}'s turn</p>
        <span className="text-sm text-muted-foreground">{timeLeft}s</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  )
}

