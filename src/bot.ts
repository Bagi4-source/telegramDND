// src/bot.ts

import { Markup, Telegraf, Context } from 'telegraf';
import { BOT_TOKEN, OPENAI_API_KEY } from '../env';
import { botAnswers } from './botAnswers';
import { GameState, Player } from './types';
import { DndLlm } from './dnd/dndLlm';
import { Mage, Person, Rogue, Warrior } from './dnd/classes';
import { Monster } from './dnd/monsters/Monsters'; // Ensure correct path
import { generateRandomMonster } from './dnd/monsters/MonsterFactory'; // Ensure correct path
import { shopItems } from './dnd/items'; // Import shop items

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

// Helper Functions
function validateCombatState(ctx: Context, chatId: number | undefined, playerId: number): boolean {
    if (chatId === undefined) {
        ctx.reply("Error: Unable to determine chat ID.");
        return false;
    }

    const gameState = gameStates[chatId];
    if (!gameState) {
        ctx.reply(botAnswers.notStarted);
        return false;
    }

    const player = gameState.players[playerId];
    if (!player) {
        ctx.reply("You are not part of the current game.");
        return false;
    }

    if (!gameState.currentMonster) {
        ctx.reply("There is no monster to fight.");
        return false;
    }

    return true;
}

function calculatePlayerDamage(player: Player): number {
    if (player.person instanceof Rogue) {
        return player.person.getStealth();
    } else {
        return player.person.getStrength();
    }
}

interface Spell {
    name: string;
    damage: number;
    manaCost: number;
}

function getSpellByName(name: string): Spell | null {
    const spells: Spell[] = [
        { name: 'Magic Bolt', damage: 15, manaCost: 10 },
        { name: 'Fire Rays', damage: 20, manaCost: 15 },
        { name: 'Cold Hand', damage: 10, manaCost: 5 },
    ];
    return spells.find(spell => spell.name.toLowerCase().replace(' ', '_') === name) || null;
}

async function initiateCombat(ctx: Context, player: Player, monster: Monster, gameState: GameState) {
    await ctx.reply(`Combat begins between ${player.name} and ${monster.getDescription()}!`);
    await presentCombatOptions(ctx, player, monster);
}

async function presentCombatOptions(ctx: Context, player: Player, monster: Monster) {
    const buttons = [];

    // All players can attack
    buttons.push(Markup.button.callback('Attack', 'combat_attack'));

    // Mages with mana can cast spells
    if (player.person instanceof Mage && player.person.getMana() > 0) {
        buttons.push(Markup.button.callback('Cast Spell', 'combat_cast_spell'));
    }

    // Players with armor can block
    if (player.person instanceof Warrior && player.person.hasArmor()) {
        buttons.push(Markup.button.callback('Block', 'combat_block'));
    }

    // Rogues can attack twice - handled in combat_attack

    await ctx.reply(`Choose your action:`, Markup.inlineKeyboard(buttons));
}

async function monsterTurn(ctx: Context, player: Player, monster: Monster, gameState: GameState) {
    // Monster decides to attack
    const damage = monster.getStrength();
    let actualDamage = damage;

    // Check if player is blocking (only Warriors can block)
    if (player.person instanceof Warrior && player.person.isBlocking()) {
        actualDamage = Math.max(0, damage - player.person.getArmor());
        await ctx.reply(`${player.name} blocks the attack, reducing damage to ${actualDamage}.`);
    }

    player.person.damage(actualDamage);
    await ctx.reply(`${monster.getDescription()} attacks ${player.name} for ${actualDamage} damage.`);

    // Check if player is defeated
    if (player.person.getHp() <= 0) {
        await ctx.reply(`${player.name} has been defeated by the monster!`);
        // Remove player from game
        delete gameState.players[player.id];
        gameState.turnOrder = gameState.turnOrder.filter(id => id !== player.id);
        await ctx.reply(botAnswers.player.defeated(player.name));
        return;
    }

    // Present combat options again
    await presentCombatOptions(ctx, player, monster);
}

// Command Handlers
(async () => {
    await bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot and get a welcome message' },
        { command: 'help', description: 'Show a list of available commands' },
        { command: 'startgame', description: 'Start a new D&D game' },
        { command: 'join', description: 'Join the current game as a player' },
        { command: 'state', description: 'Display the current state of the game' },
        { command: 'turn', description: 'Move to the next player\'s turn' },
        { command: 'endgame', description: 'End the current game' },
        { command: 'narrate', description: 'Get a narration of the game from AI' },
        { command: 'shop', description: 'Visit the shop to buy items' },
        { command: 'inventory', description: 'View your inventory and use items' },
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
                currentTurn: 0,
                currentMonster: null,
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

            // Save the monster to the game state
            gameState.currentMonster = monster;

            // Begin combat
            await initiateCombat(ctx, player, monster, gameState);
        } else {
            // Outcome 2: Find treasure
            const goldFound = Math.floor(Math.random() * 100) + 50;  // Random gold between 50 and 149
            player.person.addGold(goldFound);
            await ctx.reply(`You find a hidden treasure chest containing ${goldFound} gold! You now have ${player.person.getGold()} gold.`);
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

        // Restore player's HP
        player.person.restoreHp(); // Ensure the Person class has a restoreHp method
        await ctx.reply(`${player.name} now has ${player.person.getHp()} HP.`);
    });

    // Implement the '/shop' command
    bot.command('shop', async (ctx) => {
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

        // Present shop items
        const itemButtons = shopItems.map(item =>
            [Markup.button.callback(`${item.name} - ${item.value} gold`, `buy_${item.id}`)]
        );

        await ctx.reply("Welcome to the shop! Here are the items available:", Markup.inlineKeyboard(itemButtons));
    });

    // Handle buying items
    bot.action(/buy_(.+)/, async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;
        const itemIdStr = ctx.match?.[1];

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

        const itemId = parseInt(itemIdStr!);
        const item = shopItems.find(item => item.id === itemId);

        if (!item) {
            await ctx.reply("This item does not exist.");
            return;
        }

        // Check if player has enough gold
        if (player.person.getGold() >= item.value) {
            player.person.subtractGold(item.value);
            player.person.addItem(item);
            await ctx.reply(`You have purchased ${item.name} for ${item.value} gold. You now have ${player.person.getGold()} gold.`);
        } else {
            await ctx.reply(`You do not have enough gold to purchase ${item.name}. It costs ${item.value} gold, but you only have ${player.person.getGold()} gold.`);
        }
    });

    // Implement the '/inventory' command
    bot.command('inventory', async (ctx) => {
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

        const inventory = player.person.getInventory();
        if (inventory.length === 0) {
            await ctx.reply("Your inventory is empty.");
            return;
        }

        const itemButtons = inventory.map(item =>
            [Markup.button.callback(`${item.name}`, `use_${item.id}`)]
        );

        await ctx.reply("Your inventory:", Markup.inlineKeyboard(itemButtons));
    });

    // Handle using items
    bot.action(/use_(.+)/, async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;
        const itemIdStr = ctx.match?.[1];

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

        const itemId = parseInt(itemIdStr!);
        const item = player.person.getInventory().find(item => item.id === itemId);

        if (!item) {
            await ctx.reply("You do not have this item in your inventory.");
            return;
        }

        // Use the item
        player.person.useItem(itemId);
        await ctx.reply(`You have used ${item.name}.`);
    });

    // Single 'class' action handler already defined above

    // Handle 'combat_attack', 'combat_cast_spell', 'combat_block'
    bot.action('combat_attack', async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;

        if (!validateCombatState(ctx, chatId, playerId)) return;

        const gameState = gameStates[chatId!];
        const player = gameState.players[playerId];
        const monster = gameState.currentMonster!;

        let attackTimes = 1;

        // Rogues can attack twice
        if (player.person instanceof Rogue) {
            attackTimes = 2;
        }

        for (let i = 0; i < attackTimes; i++) {
            // Calculate damage
            const damage = calculatePlayerDamage(player);
            monster.takeDamage(damage);
            await ctx.reply(`${player.name} attacks ${monster.getDescription()} for ${damage} damage.`);
        }

        // Check if monster is defeated
        if (monster.getHp() <= 0) {
            await ctx.reply(`${monster.getDescription()} has been defeated!`);
            // Increase player's strength or stealth
            if (player.person instanceof Rogue) {
                player.person.increaseStealth(1);
            } else {
                player.person.increaseStrength(1);
            }
            await ctx.reply(`${player.name}'s stats have increased!`);
            // Remove monster from game state
            gameState.currentMonster = null;
            return;
        }

        // Monster's turn
        await monsterTurn(ctx, player, monster, gameState);
    });

    bot.action('combat_cast_spell', async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;

        if (!validateCombatState(ctx, chatId, playerId)) return;

        const gameState = gameStates[chatId!];
        const player = gameState.players[playerId];
        const monster = gameState.currentMonster!;

        if (!(player.person instanceof Mage)) {
            await ctx.reply("Only Mages can cast spells!");
            return;
        }

        // Present spell options
        await ctx.reply(`Choose a spell:`, Markup.inlineKeyboard([
            Markup.button.callback('Magic Bolt', 'spell_magic_bolt'),
            Markup.button.callback('Fire Rays', 'spell_fire_rays'),
            Markup.button.callback('Cold Hand', 'spell_cold_hand'),
        ]));
    });

    bot.action(/spell_(.+)/, async (ctx) => {
        const spellName = ctx.match?.[1];
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;

        if (!validateCombatState(ctx, chatId, playerId)) return;

        const gameState = gameStates[chatId!];
        const player = gameState.players[playerId];
        const monster = gameState.currentMonster!;

        if (!(player.person instanceof Mage)) {
            await ctx.reply("Only Mages can cast spells!");
            return;
        }

        const spell = getSpellByName(spellName!);
        if (!spell) {
            await ctx.reply("Invalid spell selected.");
            return;
        }

        if (player.person.getMana() < spell.manaCost) {
            await ctx.reply("Not enough mana to cast this spell.");
            return;
        }

        // Cast spell
        player.person.useMana(spell.manaCost);
        monster.takeDamage(spell.damage);
        await ctx.reply(`${player.name} casts ${spell.name}, dealing ${spell.damage} damage to ${monster.getDescription()}.`);

        // 50% chance to increase intelligence by 1
        if (Math.random() < 0.5) {
            player.person.increaseIntelligence(1);
            await ctx.reply(`${player.name}'s intelligence has increased by 1!`);
        }

        // Check if monster is defeated
        if (monster.getHp() <= 0) {
            await ctx.reply(`${monster.getDescription()} has been defeated!`);
            // Increase player's strength or stealth
            player.person.increaseStrength(1);
            await ctx.reply(`${player.name}'s strength has increased by 1!`);
            // Remove monster from game state
            gameState.currentMonster = null;
            return;
        }

        // Monster's turn
        await monsterTurn(ctx, player, monster, gameState);
    });

    bot.action('combat_block', async (ctx) => {
        const chatId = ctx.chat?.id;
        const playerId = ctx.from.id;

        if (!validateCombatState(ctx, chatId, playerId)) return;

        const gameState = gameStates[chatId!];
        const player = gameState.players[playerId];
        const monster = gameState.currentMonster!;

        if (!(player.person instanceof Warrior)) {
            await ctx.reply("Only Warriors can block!");
            return;
        }

        player.person.setBlocking(true);
        await ctx.reply(`${player.name} is blocking incoming attacks.`);

        // Monster's turn
        await monsterTurn(ctx, player, monster, gameState);

        // Reset blocking status
        player.person.setBlocking(false);
    });

    // Combat Helpers in Person Class
    // Add these methods to Person class if not already present
    // public setBlocking(status: boolean): void {
    //     this.isBlocking = status;
    // }

    // public isBlocking(): boolean {
    //     return this.isBlocking;
    // }

    await bot.launch();

    console.log('The bot was successfully launched!');
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
