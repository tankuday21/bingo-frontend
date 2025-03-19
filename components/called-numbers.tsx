"use client"

import { cn } from "@/lib/utils"

interface CalledNumbersProps {
  numbers: number[]
  boardSize: number
}

export function CalledNumbers({ numbers, boardSize }: CalledNumbersProps) {
  const maxNumber = boardSize * boardSize

  return (
    <div className="grid grid-cols-5 gap-1 text-center">
      {numbers.length === 0 ? (
        <p className="col-span-5 text-muted-foreground text-sm">No numbers called yet</p>
      ) : (
        numbers.map((number) => (
          <div
            key={number}
            className={cn(
              "rounded-md py-1 px-2 text-sm font-medium",
              number <= maxNumber / 4
                ? "bg-blue-100 text-blue-700"
                : number <= maxNumber / 2
                  ? "bg-green-100 text-green-700"
                  : number <= (maxNumber * 3) / 4
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700",
            )}
          >
            {number}
          </div>
        ))
      )}
    </div>
  )
}

