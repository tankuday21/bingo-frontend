"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function JoinGame() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [theme, setTheme] = useState("default")
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinGame = async () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to join the game",
        variant: "destructive",
      })
      return
    }

    if (!roomCode) {
      toast({
        title: "Room code required",
        description: "Please enter a room code to join the game",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)

    // In a real implementation, this would verify the room code with the server
    // For now, we'll simulate the API call with a timeout
    setTimeout(() => {
      // Store game settings in localStorage for this demo
      // In a real implementation, this would be handled by the server
      localStorage.setItem(
        "gameSettings",
        JSON.stringify({
          username,
          theme,
          roomCode,
          isHost: false,
        }),
      )

      router.push(`/game/${roomCode}`)
    }, 1000)
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join a Bingo Game</CardTitle>
          <CardDescription>Enter a room code to join an existing game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Your Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="neon">Neon</SelectItem>
                <SelectItem value="retro">Retro</SelectItem>
                <SelectItem value="cartoon">Cartoon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleJoinGame} disabled={isJoining} className="w-full">
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

