// /src/dnd/items

import { Item } from "../types";
import { Player } from "../types";
export const shopItems: Item[] = [
    {
        id: 1,
        name: "Health Potion",
        description: "Restores 50 HP.",
        type: "potion",
        value: 30,
        effect: (player) => {
            player.person.restoreHpBy(50);
        },
    },
    {
        id: 2,
        name: "Iron Sword",
        description: "Increases strength by 2.",
        type: "weapon",
        value: 100,
        effect: (player) => {
            player.person.increaseStrength(2);
        },
    },
    {
        id: 3,
        name: "Leather Armor",
        description: "Increases armor by 2.",
        type: "armor",
        value: 80,
        effect: (player) => {
            player.person.increaseArmor(2);
        },
    },
    // Add more items as needed
];