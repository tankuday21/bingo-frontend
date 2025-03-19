"use client"

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "./use-toast";

export function useGameSocket(roomCode: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!BACKEND_URL) {
      console.error("NEXT_PUBLIC_BACKEND_URL is not defined");
      toast({
        title: "Configuration Error",
        description: "Backend URL is not defined. Please check environment variables.",
        variant: "destructive",
      });
      return;
    }

    const socketInstance = io(BACKEND_URL, {
      query: { roomCode },
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Lost connection to the server.",
        variant: "destructive",
      });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to the server.",
        variant: "destructive",
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomCode]);

  return { socket, isConnected };
}