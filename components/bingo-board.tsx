"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

interface BingoBoardProps {
  board: number[][]
  markedCells: boolean[][]
  winningLines: number[][]
  onCellClick: (row: number, col: number) => void
  theme: string
  gameEnded: boolean
}

export function BingoBoard({ board, markedCells, winningLines, onCellClick, theme, gameEnded }: BingoBoardProps) {
  const [flatWinningCells, setFlatWinningCells] = useState<number[]>([])

  useEffect(() => {
    // Flatten the winning lines into a single array of cell indices
    const cells: number[] = []
    winningLines.forEach((line) => {
      line.forEach((cellIndex) => {
        if (!cells.includes(cellIndex)) {
          cells.push(cellIndex)
        }
      })
    })
    setFlatWinningCells(cells)
  }, [winningLines])

  const isCellInWinningLine = (row: number, col: number): boolean => {
    const boardSize = board.length
    const cellIndex = row * boardSize + col
    return flatWinningCells.includes(cellIndex)
  }

  const getCellClassName = (row: number, col: number, marked: boolean) => {
    const isWinning = isCellInWinningLine(row, col)

    return cn("aspect-square flex items-center justify-center text-lg font-semibold border rounded-md transition-all", {
      // Default theme
      "bg-white border-gray-200 hover:bg-gray-50": theme === "default" && !marked,
      "bg-primary/10 border-primary text-primary": theme === "default" && marked && !isWinning,
      "bg-green-100 border-green-500 text-green-700": theme === "default" && isWinning,

      // Neon theme
      "bg-black border-green-500 text-green-400 hover:border-green-300": theme === "neon" && !marked,
      "bg-green-900/30 border-green-400 text-green-300": theme === "neon" && marked && !isWinning,
      "bg-green-500/30 border-green-300 text-green-100 shadow-[0_0_10px_rgba(74,222,128,0.5)]":
        theme === "neon" && isWinning,

      // Retro theme
      "bg-amber-100 border-amber-700 text-amber-900 hover:bg-amber-200": theme === "retro" && !marked,
      "bg-amber-300 border-amber-800 text-amber-950": theme === "retro" && marked && !isWinning,
      "bg-amber-400 border-amber-900 text-amber-950": theme === "retro" && isWinning,

      // Cartoon theme
      "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-50": theme === "cartoon" && !marked,
      "bg-pink-100 border-pink-400 text-pink-700": theme === "cartoon" && marked && !isWinning,
      "bg-yellow-200 border-yellow-500 text-yellow-700": theme === "cartoon" && isWinning,

      "cursor-pointer": !gameEnded,
      "cursor-default": gameEnded,
    })
  }

  return (
    <div
      className="grid gap-1 md:gap-2 mx-auto"
      style={{
        gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))`,
        maxWidth: `${board.length * 4}rem`,
      }}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={getCellClassName(rowIndex, colIndex, markedCells[rowIndex][colIndex])}
            onClick={() => onCellClick(rowIndex, colIndex)}
          >
            {cell}
          </div>
        )),
      )}
    </div>
  )
}

