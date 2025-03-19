"use client"

import { Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { username: "Champion1", score: 120, wins: 5 },
  { username: "BingoMaster", score: 105, wins: 4 },
  { username: "LuckyPlayer", score: 90, wins: 3 },
  { username: "GameWinner", score: 75, wins: 2 },
  { username: "BingoNewbie", score: 60, wins: 1 },
]

export function LeaderboardDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Trophy className="mr-2 h-4 w-4" />
          Leaderboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leaderboard</DialogTitle>
          <DialogDescription>Top players ranked by score and wins</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-12 text-sm font-medium text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-3 text-right">Score</div>
            <div className="col-span-2 text-right">Wins</div>
          </div>
          <div className="space-y-2">
            {MOCK_LEADERBOARD.map((player, index) => (
              <div key={player.username} className="grid grid-cols-12 items-center py-2 border-b">
                <div className="col-span-1 font-medium">{index + 1}</div>
                <div className="col-span-6 font-medium">{player.username}</div>
                <div className="col-span-3 text-right">{player.score}</div>
                <div className="col-span-2 text-right">{player.wins}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

