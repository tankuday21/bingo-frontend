"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Crown, Users } from "lucide-react"

import { BingoBoard } from "@/components/bingo-board"
import { CalledNumbers } from "@/components/called-numbers"
import { GameHeader } from "@/components/game-header"
import { LeaderboardDialog } from "@/components/leaderboard-dialog"
import { PlayerList } from "@/components/player-list"
import { TurnIndicator } from "@/components/turn-indicator"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useGameSocket } from "@/hooks/use-game-socket"

interface Player {
  id: string
  username: string
  score: number
  isHost: boolean
  isTurn: boolean
}

export default function GamePage({ params }: { params: { roomCode: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [gameSettings, setGameSettings] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [calledNumbers, setCalledNumbers] = useState<number[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [boardSize, setBoardSize] = useState(5)
  const [myBoard, setMyBoard] = useState<number[][]>([])
  const [markedCells, setMarkedCells] = useState<boolean[][]>([])
  const [winningLines, setWinningLines] = useState<number[][]>([])

  // Initialize socket connection
  const { socket, isConnected } = useGameSocket(params.roomCode)

  useEffect(() => {
    // Load game settings from localStorage
    const settings = localStorage.getItem("gameSettings")
    if (settings) {
      const parsedSettings = JSON.parse(settings)
      setGameSettings(parsedSettings)
      if (parsedSettings.gridSize) {
        setBoardSize(parsedSettings.gridSize)
      }

      // Join or create room based on settings
      if (socket && isConnected) {
        if (parsedSettings.isHost) {
          socket.emit("createRoom", {
            username: parsedSettings.username,
            gridSize: parsedSettings.gridSize,
            theme: parsedSettings.theme,
          })
        } else {
          socket.emit("joinRoom", {
            roomCode: params.roomCode,
            username: parsedSettings.username,
            theme: parsedSettings.theme,
          })
        }
      }
    } else {
      // If no settings, redirect to home
      router.push("/")
    }

    return () => {
      // Cleanup
    }
  }, [router, params.roomCode, socket, isConnected])

  useEffect(() => {
    if (!socket) return

    // Set up socket event listeners
    socket.on("roomCreated", ({ roomCode }) => {
      console.log(`Room created: ${roomCode}`)
    })

    socket.on("playerJoined", ({ players }) => {
      setPlayers(players)
    })

    socket.on("playerLeft", ({ players }) => {
      setPlayers(players)
    })

    socket.on("gameState", ({ gridSize, players, board, calledNumbers, gameStarted, gameEnded, winner }) => {
      setBoardSize(gridSize)
      setPlayers(players)
      setMyBoard(board)
      setCalledNumbers(calledNumbers)
      setGameStarted(gameStarted)
      setGameEnded(gameEnded)
      setWinner(winner)

      // Initialize marked cells
      const marked: boolean[][] = Array(gridSize)
        .fill(0)
        .map(() => Array(gridSize).fill(false))

      // Mark called numbers
      for (const number of calledNumbers) {
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (board[i][j] === number) {
              marked[i][j] = true
            }
          }
        }
      }

      setMarkedCells(marked)

      // Set current player
      const currentPlayerObj = players.find((p) => p.isTurn)
      if (currentPlayerObj) {
        setCurrentPlayer(currentPlayerObj.username)
      }
    })

    socket.on("gameStarted", ({ players, currentPlayer }) => {
      setGameStarted(true)
      setPlayers(players)
      setCurrentPlayer(currentPlayer)
    })

    socket.on("numberCalled", ({ number, calledNumbers, calledBy, automatic }) => {
      setCalledNumbers(calledNumbers)

      // Mark the number on the board
      const newMarkedCells = [...markedCells]
      for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
          if (myBoard[i][j] === number) {
            newMarkedCells[i][j] = true
          }
        }
      }
      setMarkedCells(newMarkedCells)

      // Show toast
      toast({
        title: `Number ${number} called`,
        description: automatic ? `${calledBy} ran out of time. Random number selected.` : `Called by ${calledBy}`,
      })
    })

    socket.on("turnChanged", ({ currentPlayer, timeLeft }) => {
      setCurrentPlayer(currentPlayer)
      setTimeLeft(timeLeft)

      // Show toast for new turn
      toast({
        title: `${currentPlayer}'s turn`,
        description: "15 seconds to select a number",
      })
    })

    socket.on("timeUpdate", ({ timeLeft }) => {
      setTimeLeft(timeLeft)
    })

    socket.on("gameEnded", ({ winner, winningLines }) => {
      setWinner(winner)
      setGameEnded(true)
      setWinningLines(winningLines)

      toast({
        title: "Bingo!",
        description: `${winner} completed 5 lines and won the game!`,
      })
    })

    socket.on("error", ({ message }) => {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    })

    return () => {
      socket.off("roomCreated")
      socket.off("playerJoined")
      socket.off("playerLeft")
      socket.off("gameState")
      socket.off("gameStarted")
      socket.off("numberCalled")
      socket.off("turnChanged")
      socket.off("timeUpdate")
      socket.off("gameEnded")
      socket.off("error")
    }
  }, [socket, toast, boardSize, markedCells, myBoard])

  // Start the game (host only)
  const handleStartGame = () => {
    if (socket && gameSettings?.isHost) {
      socket.emit("startGame", { roomCode: params.roomCode })
    }
  }

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    // Only allow clicking if it's your turn and the game has started
    const isMyTurn = players.find((p) => p.isTurn)?.id === socket?.id
    if (!isMyTurn || !gameStarted || gameEnded || !socket) return

    const number = myBoard[row][col]
    socket.emit("callNumber", { roomCode: params.roomCode, number })
  }

  if (!gameSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading game...</p>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-background ${gameSettings.theme === "neon" ? "bg-black text-green-400" : ""} ${gameSettings.theme === "retro" ? "bg-amber-50 text-amber-900" : ""} ${gameSettings.theme === "cartoon" ? "bg-blue-50 text-blue-900" : ""}`}
    >
      <GameHeader roomCode={params.roomCode} theme={gameSettings.theme} isHost={gameSettings.isHost} />

      <div className="container py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 bg-card rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Players
              </h3>
              <span className="text-sm text-muted-foreground">{players.length}</span>
            </div>
            <PlayerList players={players} currentPlayer={currentPlayer} />

            {gameSettings.isHost && !gameStarted && players.length >= 2 && (
              <Button onClick={handleStartGame} className="w-full mt-4">
                Start Game
              </Button>
            )}

            {!gameStarted && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {gameSettings.isHost ? "Waiting for players to join..." : "Waiting for the host to start the game..."}
              </p>
            )}
          </div>

          {gameStarted && (
            <>
              <div className="p-4 bg-card rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    Turn Timer
                  </h3>
                  <span className={`font-mono text-lg ${timeLeft <= 5 ? "text-red-500" : ""}`}>{timeLeft}s</span>
                </div>
                <TurnIndicator currentPlayer={currentPlayer} timeLeft={timeLeft} totalTime={15} />
              </div>

              <div className="p-4 bg-card rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Called Numbers</h3>
                <CalledNumbers numbers={calledNumbers} boardSize={boardSize} />
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-9">
          <div className="p-4 bg-card rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Your Bingo Board</h2>
              {gameEnded && (
                <div className="flex items-center text-yellow-500">
                  <Crown className="mr-1 h-5 w-5" />
                  <span className="font-semibold">{winner} Won!</span>
                </div>
              )}
            </div>

            {myBoard.length > 0 ? (
              <BingoBoard
                board={myBoard}
                markedCells={markedCells}
                winningLines={winningLines}
                onCellClick={handleCellClick}
                theme={gameSettings.theme}
                gameEnded={gameEnded}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p>Loading board...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-4 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/")}>
          Exit Game
        </Button>

        <LeaderboardDialog />
      </div>
    </div>
  )
}

