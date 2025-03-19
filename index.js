const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
})

// Store game rooms and their state
const gameRooms = new Map()

// Generate a random board
function generateBoard(size) {
  const maxNumber = size * size
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1)

  // Shuffle the numbers
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[numbers[i], numbers[j]] = [numbers[j], numbers[i]]
  }

  // Create the board
  const board = []
  for (let i = 0; i < size; i++) {
    board[i] = []
    for (let j = 0; j < size; j++) {
      board[i][j] = numbers[i * size + j]
    }
  }

  return board
}

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Create a new game room
  socket.on("createRoom", ({ username, gridSize, theme }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    gameRooms.set(roomCode, {
      host: socket.id,
      gridSize: Number.parseInt(gridSize),
      players: [
        {
          id: socket.id,
          username,
          score: 0,
          isHost: true,
          isTurn: true,
          board: generateBoard(Number.parseInt(gridSize)),
          markedCells: Array(Number.parseInt(gridSize))
            .fill()
            .map(() => Array(Number.parseInt(gridSize)).fill(false)),
          theme,
        },
      ],
      calledNumbers: [],
      currentPlayerIndex: 0,
      gameStarted: false,
      gameEnded: false,
      winner: null,
      turnTimeLeft: 15,
      turnTimer: null,
    })

    socket.join(roomCode)
    socket.emit("roomCreated", { roomCode })

    console.log(`Room created: ${roomCode} by ${username}`)
  })

  // Join an existing game room
  socket.on("joinRoom", ({ roomCode, username, theme }) => {
    const room = gameRooms.get(roomCode)

    if (!room) {
      socket.emit("error", { message: "Room not found" })
      return
    }

    if (room.gameStarted) {
      socket.emit("error", { message: "Game already started" })
      return
    }

    // Add player to the room
    room.players.push({
      id: socket.id,
      username,
      score: 0,
      isHost: false,
      isTurn: false,
      board: generateBoard(room.gridSize),
      markedCells: Array(room.gridSize)
        .fill()
        .map(() => Array(room.gridSize).fill(false)),
      theme,
    })

    socket.join(roomCode)

    // Notify all players in the room
    io.to(roomCode).emit("playerJoined", {
      players: room.players.map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
        isHost: p.isHost,
        isTurn: p.isTurn,
      })),
    })

    // Send the game state to the new player
    socket.emit("gameState", {
      roomCode,
      gridSize: room.gridSize,
      players: room.players.map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
        isHost: p.isHost,
        isTurn: p.isTurn,
      })),
      board: room.players.find((p) => p.id === socket.id).board,
      calledNumbers: room.calledNumbers,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      winner: room.winner,
    })

    console.log(`Player ${username} joined room: ${roomCode}`)
  })

  // Start the game
  socket.on("startGame", ({ roomCode }) => {
    const room = gameRooms.get(roomCode)

    if (!room) {
      socket.emit("error", { message: "Room not found" })
      return
    }

    if (socket.id !== room.host) {
      socket.emit("error", { message: "Only the host can start the game" })
      return
    }

    room.gameStarted = true

    // Start the turn timer
    startTurnTimer(roomCode)

    io.to(roomCode).emit("gameStarted", {
      players: room.players.map((p) => ({
        id: p.id,
        username: p.username,
        score: p.score,
        isHost: p.isHost,
        isTurn: p.isTurn,
      })),
      currentPlayer: room.players[room.currentPlayerIndex].username,
    })

    console.log(`Game started in room: ${roomCode}`)
  })

  // Player calls a number
  socket.on("callNumber", ({ roomCode, number }) => {
    const room = gameRooms.get(roomCode)

    if (!room) {
      socket.emit("error", { message: "Room not found" })
      return
    }

    if (!room.gameStarted || room.gameEnded) {
      socket.emit("error", { message: "Game not in progress" })
      return
    }

    const playerIndex = room.players.findIndex((p) => p.id === socket.id)
    if (playerIndex !== room.currentPlayerIndex) {
      socket.emit("error", { message: "Not your turn" })
      return
    }

    if (room.calledNumbers.includes(number)) {
      socket.emit("error", { message: "Number already called" })
      return
    }

    // Add number to called numbers
    room.calledNumbers.push(number)

    // Mark the number on all players' boards
    room.players.forEach((player) => {
      for (let i = 0; i < room.gridSize; i++) {
        for (let j = 0; j < room.gridSize; j++) {
          if (player.board[i][j] === number) {
            player.markedCells[i][j] = true
          }
        }
      }

      // Check for win
      const winningLines = checkForWin(player.markedCells, room.gridSize)
      if (winningLines.length >= 5 && !room.gameEnded) {
        room.gameEnded = true
        room.winner = player.username

        // Clear the turn timer
        clearInterval(room.turnTimer)

        // Update player score
        player.score += 100

        io.to(roomCode).emit("gameEnded", {
          winner: player.username,
          winningLines,
        })

        console.log(`Player ${player.username} won in room: ${roomCode}`)
      }
    })

    // Notify all players
    io.to(roomCode).emit("numberCalled", {
      number,
      calledNumbers: room.calledNumbers,
      calledBy: room.players[playerIndex].username,
    })

    // If game hasn't ended, move to next turn
    if (!room.gameEnded) {
      nextTurn(roomCode)
    }
  })

  // Player disconnects
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`)

    // Find all rooms the player is in
    for (const [roomCode, room] of gameRooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id)

      if (playerIndex !== -1) {
        const isHost = room.players[playerIndex].isHost
        const isTurn = room.players[playerIndex].isTurn

        // Remove player from the room
        room.players.splice(playerIndex, 1)

        // If no players left, delete the room
        if (room.players.length === 0) {
          clearInterval(room.turnTimer)
          gameRooms.delete(roomCode)
          console.log(`Room deleted: ${roomCode}`)
          continue
        }

        // If host left, assign a new host
        if (isHost && room.players.length > 0) {
          room.players[0].isHost = true
          room.host = room.players[0].id
        }

        // If it was this player's turn, move to next turn
        if (isTurn && room.gameStarted && !room.gameEnded) {
          // Adjust currentPlayerIndex if needed
          if (room.currentPlayerIndex >= room.players.length) {
            room.currentPlayerIndex = 0
          }

          // Update turn
          room.players.forEach((p, i) => {
            p.isTurn = i === room.currentPlayerIndex
          })

          // Reset turn timer
          room.turnTimeLeft = 15

          io.to(roomCode).emit("turnChanged", {
            currentPlayer: room.players[room.currentPlayerIndex].username,
            timeLeft: room.turnTimeLeft,
          })
        }

        // Notify remaining players
        io.to(roomCode).emit("playerLeft", {
          players: room.players.map((p) => ({
            id: p.id,
            username: p.username,
            score: p.score,
            isHost: p.isHost,
            isTurn: p.isTurn,
          })),
        })

        console.log(`Player ${socket.id} left room: ${roomCode}`)
      }
    }
  })
})

// Start the turn timer for a room
function startTurnTimer(roomCode) {
  const room = gameRooms.get(roomCode)
  if (!room) return

  room.turnTimeLeft = 15

  // Clear any existing timer
  if (room.turnTimer) {
    clearInterval(room.turnTimer)
  }

  // Start a new timer
  room.turnTimer = setInterval(() => {
    room.turnTimeLeft--

    // Emit time update
    io.to(roomCode).emit("timeUpdate", { timeLeft: room.turnTimeLeft })

    // If time runs out, automatically call a random number or skip turn
    if (room.turnTimeLeft <= 0) {
      const currentPlayer = room.players[room.currentPlayerIndex]

      // If game hasn't ended, pick a random number or skip turn
      if (!room.gameEnded) {
        // Get all uncalled numbers
        const maxNumber = room.gridSize * room.gridSize
        const uncalledNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1).filter(
          (num) => !room.calledNumbers.includes(num),
        )

        if (uncalledNumbers.length > 0) {
          // Pick a random uncalled number
          const randomIndex = Math.floor(Math.random() * uncalledNumbers.length)
          const randomNumber = uncalledNumbers[randomIndex]

          // Add number to called numbers
          room.calledNumbers.push(randomNumber)

          // Mark the number on all players' boards
          room.players.forEach((player) => {
            for (let i = 0; i < room.gridSize; i++) {
              for (let j = 0; j < room.gridSize; j++) {
                if (player.board[i][j] === randomNumber) {
                  player.markedCells[i][j] = true
                }
              }
            }

            // Check for win
            const winningLines = checkForWin(player.markedCells, room.gridSize)
            if (winningLines.length >= 5 && !room.gameEnded) {
              room.gameEnded = true
              room.winner = player.username

              // Clear the turn timer
              clearInterval(room.turnTimer)

              // Update player score
              player.score += 100

              io.to(roomCode).emit("gameEnded", {
                winner: player.username,
                winningLines,
              })

              console.log(`Player ${player.username} won in room: ${roomCode}`)
            }
          })

          // Notify all players
          io.to(roomCode).emit("numberCalled", {
            number: randomNumber,
            calledNumbers: room.calledNumbers,
            calledBy: currentPlayer.username,
            automatic: true,
          })
        }

        // Move to next turn if game hasn't ended
        if (!room.gameEnded) {
          nextTurn(roomCode)
        }
      }
    }
  }, 1000)
}

// Move to the next turn
function nextTurn(roomCode) {
  const room = gameRooms.get(roomCode)
  if (!room || room.gameEnded) return

  // Move to next player
  room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length

  // Update player turns
  room.players.forEach((player, index) => {
    player.isTurn = index === room.currentPlayerIndex
  })

  // Reset turn timer
  room.turnTimeLeft = 15

  // Notify all players
  io.to(roomCode).emit("turnChanged", {
    currentPlayer: room.players[room.currentPlayerIndex].username,
    timeLeft: room.turnTimeLeft,
  })
}

// Check for winning lines
function checkForWin(markedCells, size) {
  const lines = []

  // Check rows
  for (let i = 0; i < size; i++) {
    if (markedCells[i].every((cell) => cell)) {
      lines.push(Array.from({ length: size }, (_, j) => i * size + j))
    }
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    if (Array.from({ length: size }, (_, i) => markedCells[i][j]).every((cell) => cell)) {
      lines.push(Array.from({ length: size }, (_, i) => i * size + j))
    }
  }

  // Check main diagonal
  if (Array.from({ length: size }, (_, i) => markedCells[i][i]).every((cell) => cell)) {
    lines.push(Array.from({ length: size }, (_, i) => i * size + i))
  }

  // Check other diagonal
  if (Array.from({ length: size }, (_, i) => markedCells[i][size - 1 - i]).every((cell) => cell)) {
    lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)))
  }

  return lines
}

// API routes
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

app.get("/api/rooms", (req, res) => {
  const rooms = Array.from(gameRooms.entries()).map(([code, room]) => ({
    code,
    players: room.players.length,
    gridSize: room.gridSize,
    gameStarted: room.gameStarted,
    gameEnded: room.gameEnded,
  }))

  res.status(200).json({ rooms })
})

// Start the server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

