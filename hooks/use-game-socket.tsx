"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useGameSocket(roomCode: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Create socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      query: { roomCode },
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Connected to socket server")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [roomCode])

  return { socket, isConnected }
}

