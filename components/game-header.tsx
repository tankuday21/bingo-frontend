"use client"

import { Copy, Home } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface GameHeaderProps {
  roomCode: string
  theme: string
  isHost: boolean
}

export function GameHeader({ roomCode, theme, isHost }: GameHeaderProps) {
  const { toast } = useToast()

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    toast({
      title: "Room code copied",
      description: "Share this code with your friends to join the game",
    })
  }

  return (
    <header
      className={`py-4 border-b ${theme === "neon" ? "border-green-500 bg-black" : ""} ${theme === "retro" ? "border-amber-700 bg-amber-100" : ""} ${theme === "cartoon" ? "border-blue-300 bg-blue-50" : ""}`}
    >
      <div className="container flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Bingo Game</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Room:</span>{" "}
            <span className="font-mono font-medium">{roomCode}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={copyRoomCode}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

