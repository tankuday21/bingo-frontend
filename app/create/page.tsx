"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { useGameSocket } from "@/hooks/use-game-socket";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function CreateGame() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [gridSize, setGridSize] = useState("5");
  const [theme, setTheme] = useState("default");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const { socket, isConnected } = useGameSocket(""); // Empty roomCode initially

  useEffect(() => {
    if (!socket) return;

    socket.on("roomCreated", ({ roomCode }) => {
      setRoomCode(roomCode);
      setIsCreated(true);
      setIsCreating(false);
    });

    socket.on("error", ({ message }) => {
      setIsCreating(false);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    });

    return () => {
      socket.off("roomCreated");
      socket.off("error");
    };
  }, [socket, toast]);

  const handleCreateGame = () => {
    if (!username) {
      toast({
        title: "Username required",
        description: "Please enter a username to create a game",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !socket) {
      toast({
        title: "Connection Error",
        description: "Not connected to the server. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    socket.emit("createRoom", { username, gridSize: Number.parseInt(gridSize), theme });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Room code copied",
      description: "Share this code with your friends to join the game",
    });
  };

  const startGame = () => {
    localStorage.setItem(
      "gameSettings",
      JSON.stringify({
        username,
        gridSize: Number.parseInt(gridSize),
        theme,
        roomCode,
        isHost: true,
      }),
    );

    router.push(`/game/${roomCode}`);
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create a Bingo Game</CardTitle>
          <CardDescription>Set up your game and invite players</CardDescription>
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
            <Label>Grid Size</Label>
            <RadioGroup value={gridSize} onValueChange={setGridSize} className="flex space-x-2">
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="5" id="grid-5" />
                <Label htmlFor="grid-5">5x5</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="6" id="grid-6" />
                <Label htmlFor="grid-6">6x6</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="7" id="grid-7" />
                <Label htmlFor="grid-7">7x7</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="8" id="grid-8" />
                <Label htmlFor="grid-8">8x8</Label>
              </div>
            </RadioGroup>
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

          {isCreated && (
            <div className="p-4 border rounded-md bg-muted">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Room Code:</p>
                  <p className="text-2xl font-bold tracking-wider">{roomCode}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={copyRoomCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {!isCreated ? (
            <Button onClick={handleCreateGame} disabled={isCreating} className="w-full">
              {isCreating ? "Creating..." : "Create Game"}
            </Button>
          ) : (
            <Button onClick={startGame} className="w-full">
              Start Game
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}