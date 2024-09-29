import {Telegraf} from 'telegraf';
import {BOT_TOKEN, OPENAI_API_KEY} from '../env';
import {botAnswers} from "./botAnswers";
import {GameState, Player} from "./types";
import {DndLlm} from "./dnd/dndLlm";
import {Person} from "./dnd/classes";

const bot = new Telegraf(BOT_TOKEN);


const gameStates: { [chatId: string]: GameState } = {};

const dndLlm = new DndLlm({
    token: OPENAI_API_KEY,
    model: 'gpt-4o-mini',
});

(async () => {
    await bot.telegram.setMyCommands([
        {command: 'start', description: 'Start the bot and get a welcome message'},
        {command: 'help', description: 'Show a list of available commands'},
        {command: 'startgame', description: 'Start a new D&D game'},
        {command: 'join', description: 'Join the current game as a player'},
        {command: 'state', description: 'Display the current state of the game'},
        {command: 'turn', description: 'Move to the next player\'s turn'},
        {command: 'endgame', description: 'End the current game'},
        {command: 'narrate', description: 'Get a narration of the game from AI'}
    ]);

    bot.start(async (ctx) => {
        await ctx.reply(botAnswers.helpCommandDescription);
    });

    bot.help(async (ctx) => {
        await ctx.reply(botAnswers.helpCommandDescription);
    });


    bot.command('startgame', async (ctx) => {
        const chatId = ctx.chat.id;

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
    })

    bot.command('join', async (ctx) => {
        const chatId = ctx.chat.id;
        const playerId = ctx.from.id;
        const playerName = ctx.from.first_name;

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }

        if (gameStates[chatId].players[playerId]) {
            await ctx.reply(botAnswers.player.alreadyJoined(playerName));
            return;
        }

        const newPlayer: Player = {
            id: playerId,
            name: playerName,
            person: new Person(100, 100, 100, 100),
            initiative: Math.floor(Math.random() * 20) + 1
        };

        gameStates[chatId].players[playerId] = newPlayer;
        gameStates[chatId].turnOrder.push(playerId);

        await ctx.reply(botAnswers.player.joined(newPlayer.name, newPlayer.initiative));
    });

    // Команда для показа состояния игры
    bot.command('state', async (ctx) => {
        const chatId = ctx.chat.id;

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
        const chatId = ctx.chat.id;

        if (gameStates[chatId]) {
            delete gameStates[chatId];
            await ctx.reply(botAnswers.endGame.success);
        } else {
            await ctx.reply(botAnswers.endGame.notStarted);
        }
    });

    // Команда для хода игрока
    bot.command('turn', async (ctx) => {
        const chatId = ctx.chat.id;

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
        const chatId = ctx.chat.id;

        if (!gameStates[chatId]) {
            await ctx.reply(botAnswers.notStarted);
            return;
        }
        await ctx.sendChatAction('typing');

        const gameState = gameStates[chatId];
        const narration = await dndLlm.getNarration(Object.values(gameState.players), gameState.players[gameState.turnOrder[gameState.currentTurn]]);

        await ctx.reply(narration);
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
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
        }

        const player = gameState.players[currentPlayerId];
        console.log(player)
    });

    await bot.launch();

    console.log('The bot was successfully launched!');
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();