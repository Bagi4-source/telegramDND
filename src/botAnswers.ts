// src/botAnswers.ts

import { Player } from "./types";

export const botAnswers = {
    helpCommandDescription: `
Welcome to the D&D Telegram bot! Here is a list of available commands:

/start - Start the bot and get a welcome message.
/help - Show this help message with a list of all available commands.

/startgame - Start a new D&D game.
/join - Join the current game as a player.
/state - Display the current state of the game, including player HP and initiative.
/turn - Progress to the next player's turn.
/endgame - End the current game.

/narrate - Get a dynamic narration of the current game situation from the AI storyteller.
    `,
    alreadyStarted: "The game has already started. To end the game, type /endgame.",
    gameStarted: "The D&D game has begun! Add players using the /join command.",
    notStarted: "Please start the game first using the /startgame command.",
    player: {
        joined: (name: string, initiative: string | number) => `Player ${name} has joined the game with an initiative of ${initiative}.`,
        alreadyJoined: (name: string) => `Player ${name} is already part of the game.`,
        getState: (player: Player) => `Player ${player.name}: ${player.person.toString()}, initiative: ${player.initiative.toString()}`,
        defeated: (name: string) => `${name} has been defeated and is out of the game.`,
    },
    endGame: {
        success: "The game has ended.",
        notStarted: "The game hasn't been started yet.",
    },
    turn: {
        emptyPlayerOrder: "There are no players in the game.",
        playerTurn: (name: string) => `It's ${name}'s turn.`,
        anotherPlayerTurn: "It's not your turn!",
    },
};
