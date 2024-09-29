// src/dnd/MonsterFactory.ts

import { Monster, MonsterMove } from './Monsters'; // Adjust the import path as necessary
import { Person } from '../classes/Person';

export function generateRandomMonster(): Monster {
    const monsters: Monster[] = [
        new Monster(
            50, // HP
            10, // Strength
            8,  // Agility
            5,  // Intelligence
            12, // Initiative
            "Goblin",
            [
                { name: "Slash", damage: 10, description: "A quick slash with a rusty dagger." },
                { name: "Stab", damage: 12, description: "A precise stab aiming for vital points." }
            ]
        ),
        new Monster(
            80,
            15,
            6,
            7,
            14,
            "Orc",
            [
                { name: "Smash", damage: 15, description: "A powerful smash with a heavy club." },
                { name: "Roar", damage: 0, description: "A fearsome roar that intimidates enemies." }
            ]
        ),
        // Add more predefined monsters or implement random generation logic
    ];

    // Select a random monster from the list
    const randomIndex = Math.floor(Math.random() * monsters.length);
    return monsters[randomIndex];
}
