// src/bot.ts

import { Markup, Telegraf } from 'telegraf';
import { BOT_TOKEN, OPENAI_API_KEY } from '../env';
import { botAnswers } from './botAnswers';
import { GameState, Player } from './types';
import { DndLlm } from './dnd/dndLlm';
import { Mage, Person, Rogue, Warrior } from './dnd/classes';
import { Monster } from './dnd/monsters/Monsters'; // Ensure correct path
import { generateRandomMonster } from './dnd/monsters/MonsterFactory'; // Ensure correct path

const bot = new Telegraf(BOT_TOKEN);

// Update gameStates to use number keys
const gameStates: { [chatId: number]: GameState } = {};

const dndLlm = new DndLlm({
    token: OPENAI_API_KEY,
    model: 'gpt-4o-mini',
});

function mockPlayerDescription(player: Player): string {
    return `You see ${player.name}, a brave adventurer with an initiative score of ${player.initiative}. They are ready to embark on a grand adventure.`;
}

function mockDungeonDescription(): string {
    return `The dungeon looms before you, dark and foreboding. The air is thick with the scent of danger. You feel a shiver down your spine as you prepare to enter.`;
}

(async () => {
    await bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot and get a welcome message' },
        { command: 'help', description: 'Show a list of available commands' },
        { command: 'startgame', description: 'Start a new D&D game' },
        { command: 'join', description: 'Join the current game as a player' },
        { command: 'state', description: 'Display the current state of the game' },
        { command: 'turn', description: 'Move to the next player\'s turn' },
        { command: 'endgame', description: 'End the current game' },
        { command: 'narrate', description: 'Get a narration of the game from AI' }
    ]);

    bot.start(async (ctx) => {
        await ctx.reply(botAnswers.helpCommandDescription);
    });

    bot.help(async (ctx) => {
        await ctx.reply(botAnswers.helpCommandDescription);
    });

    bot.command('startgame', async (ctx) => {
        const chatId: number = ctx.chat.id; // chatId is number

        if (!gameStates[chatId]) {
            gameStates[chatId] = {
                players: {},
                turnOrder: [],
                currentTurn: 0
            };
            await ctx.reply(botAnswers.gameStarted);
        } else {
            await ctx.reply(botAnswers.alreadyStarted);
        }
    });

    bot.command('join', async (ctx) => {
        const chatId = ctx.chat?.id;  // chatId is number | undefined
        const playerId = ctx.from.id;
        const playerName = ctx.from.first_name;

        if (chatId === undefined) {
            await ctx.reply("Error: Unable to determine chat ID.");
            return;
        }

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        if (gameStates[chatId].players[playerId]) {
            await ctx.reply(botAnswers.player.alreadyJoined(playerName));
            return;
        }

        // First player triggers dungeon description
        if (Object.keys(gameStates[chatId].players).length === 0) {
            await ctx.reply(mockDungeonDescription());
        }

        const initiative = Math.floor(Math.random() * 20) + 1;
        const newPlayer: Player = {
            id: playerId,
            name: playerName,
            person: new Person(100, 100, 10, 10, 10, initiative),
            initiative
        };

        gameStates[chatId].players[playerId] = newPlayer;
        gameStates[chatId].turnOrder.push(playerId);

        // Mock function to print player's description
        await ctx.reply(mockPlayerDescription(newPlayer));

        await ctx.reply(botAnswers.player.joined(newPlayer.name, newPlayer.initiative), Markup.inlineKeyboard([
            Markup.button.callback('Маг', 'class_mage'),
            Markup.button.callback('Плут', 'class_rogue'),
            Markup.button.callback('Воин', 'class_warrior')
        ]));
    });

    // Single 'class' action handler
    bot.action(/class_(.+)/, async (ctx) => {
        const chatId = ctx.chat?.id;  // chatId is number | undefined
        const playerId = ctx.from.id;
        const className = ctx.match?.[1]; // Ensure className is defined

        if (chatId === undefined) {
            await ctx.reply("Error: Unable to determine chat ID.");
            return;
        }

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        const player = gameStates[chatId].players[playerId];

        if (player && className) {
            switch (className) {
                case 'mage':
                    player.person = new Mage(100, 100, 100, 5, 7, 15, player.initiative);
                    break;
                case 'rogue':
                    player.person = new Rogue(120, 120, 50, 6, 18, 10, player.initiative);
                    break;
                case 'warrior':
                    player.person = new Warrior(200, 180, 5, 20, 10, 3, player.initiative);
                    break;
                default:
                    await ctx.reply("Ошибка: неверный класс.");
                    return;
            }
            await ctx.deleteMessage();
            await ctx.reply(botAnswers.player.getState(player));

            // New buttons for player actions based on initiative
            await ctx.reply(`What would you like to do, ${player.name}?`, Markup.inlineKeyboard([
                Markup.button.callback('Explore', 'action_explore'),
                Markup.button.callback('Rest', 'action_rest')
            ]));
        } else {
            await ctx.reply("Ошибка: Неверные данные.");
        }
    });

    // Actions for exploring or resting
    bot.action('action_explore', async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;

        if (chatId === undefined) {
            await ctx.reply("Error: Unable to determine chat ID.");
            return;
        }

        const gameState = gameStates[chatId];
        if (!gameState) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        const player = gameState.players[playerId];
        if (!player) {
            await ctx.reply("You are not part of the current game.");
            return;
        }

        // Roll a d20
        await ctx.reply("Rolling a d20...");
        const roll = Math.floor(Math.random() * 20) + 1;
        await ctx.reply(`You rolled a ${roll}.`);

        if (roll <= 10) {
            // Outcome 1: Encounter a monster
            const monster = generateRandomMonster();
            await ctx.reply(`You encounter a monster! ${monster.toString()}`);

            // Here, you can implement combat logic or further interactions
            // For simplicity, let's assume the monster attacks the player
            monster.attack(player.person);

            // Check if player is dead
            if (player.person.getHp() <= 0) {
                await ctx.reply(`${player.name} has been defeated by the monster!`);
                // Optionally, remove the player from the game or end the game
                delete gameState.players[playerId];
                gameState.turnOrder = gameState.turnOrder.filter(id => id !== playerId);
                await ctx.reply(botAnswers.player.defeated(player.name));
            } else {
                await ctx.reply(`${player.name} has ${player.person.getHp()} HP remaining.`);
            }
        } else {
            // Outcome 2: Find treasure
            await ctx.reply("You find a hidden treasure chest filled with gold!");
            // Optionally, update player stats or inventory
            // For example, increase player's gold
            // player.gold += 100; // Ensure Player interface has a 'gold' property
        }
    });

    bot.action('action_rest', async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;

        if (chatId === undefined) {
            await ctx.reply("Error: Unable to determine chat ID.");
            return;
        }

        const gameState = gameStates[chatId];
        if (!gameState) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        const player = gameState.players[playerId];
        if (!player) {
            await ctx.reply("You are not part of the current game.");
            return;
        }

        await ctx.reply(`You take a moment to rest and recover your strength.`);

        // Optionally, restore player's HP
        player.person.restoreHp(); // Ensure the Person class has a restoreHp method
        await ctx.reply(`${player.name} now has ${player.person.getHp()} HP.`);
    });

    // Команда для показа состояния игры
    bot.command('state', async (ctx) => {
        const chatId: number = ctx.chat.id; // chatId is number

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        const gameState = gameStates[chatId];
        const playerStates = Object.values(gameState.players)
            .map(player => `${player.name}: ${player.person.toString()}, Initiative ${player.initiative}`)
            .join('\n');

        await ctx.reply(`Состояние игры:\n${playerStates}`);
    });

    // Команда для окончания игры
    bot.command('endgame', async (ctx) => {
        const chatId: number = ctx.chat.id; // chatId is number

        if (gameStates[chatId]) {
            delete gameStates[chatId];
            await ctx.reply(botAnswers.endGame.success);
        } else {
            await ctx.reply(botAnswers.endGame.notStarted);
        }
    });

    // Команда для хода игрока
    bot.command('turn', async (ctx) => {
        const chatId: number = ctx.chat.id; // chatId is number

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        const gameState = gameStates[chatId];
        if (gameState.turnOrder.length === 0) {
            await ctx.reply(botAnswers.turn.emptyPlayerOrder);
            return;
        }

        const currentTurn = gameState.currentTurn;
        const currentPlayerId = gameState.turnOrder[currentTurn];
        const player = gameState.players[currentPlayerId];

        await ctx.reply(botAnswers.turn.playerTurn(player.name));

        gameState.currentTurn = (currentTurn + 1) % gameState.turnOrder.length;
    });

    bot.command('narrate', async (ctx) => {
        const chatId: number = ctx.chat.id; // chatId is number

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }
        await ctx.sendChatAction('typing');

        const gameState = gameStates[chatId];
        const narration = await dndLlm.getNarration(
            Object.values(gameState.players),
            gameState.players[gameState.turnOrder[gameState.currentTurn]]
        );

        await ctx.reply(narration);
    });

    bot.on('text', async (ctx) => {
        const chatId: number = ctx.chat.id; // chatId is number
        const userId = ctx.from.id;

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        const gameState = gameStates[chatId];
        if (gameState.turnOrder.length === 0) {
            await ctx.reply(botAnswers.turn.emptyPlayerOrder);
            return;
        }

        const currentTurn = gameState.currentTurn;
        const currentPlayerId = gameState.turnOrder[currentTurn];

        if (currentPlayerId !== userId) {
            await ctx.reply(botAnswers.turn.anotherPlayerTurn);
            return;
        }

        const player = gameState.players[currentPlayerId];
        // Here you can add logic for processing the player's text input
    });

    await bot.launch();

    console.log('The bot was successfully launched!');
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
