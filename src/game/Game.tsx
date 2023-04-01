import { useEffect } from "react"
import { doGame } from './runGame'

export const Game = () => {
    useEffect(() => {
        const game = document.getElementById("game")
        if (game?.children.length === 0) {
            doGame(document.getElementById("game") || undefined)
        }
    }, [])
    return <div id="game">
    </div>
}