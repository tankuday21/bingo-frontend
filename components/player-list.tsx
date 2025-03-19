interface Player {
  id: string
  username: string
  score: number
  isHost: boolean
  isTurn: boolean
}

interface PlayerListProps {
  players: Player[]
  currentPlayer: string
}

export function PlayerList({ players, currentPlayer }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center justify-between p-2 rounded-md ${
            player.username === currentPlayer ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
          }`}
        >
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${player.isTurn ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="font-medium">{player.username}</span>
            {player.isHost && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Host</span>
            )}
          </div>
          <span className="text-sm">{player.score}</span>
        </div>
      ))}
    </div>
  )
}

