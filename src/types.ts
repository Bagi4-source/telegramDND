import {Person} from "./dnd/classes";
import { MonsterMove } from "./dnd/monsters/Monsters";

export interface Item {
    id: number;
    name: string;
    description: string;
    type: string;  // e.g., 'potion', 'weapon', 'armor'
    value: number;  // Cost of the item
    effect: (person: Person) => void;  // Function that applies the item's effect
}


export interface GameState {
    players: { [key: string | number]: Player };
    turnOrder: (string | number)[];
    currentTurn: number;
}

export interface Player {
    id: number;
    name: string;
    person: Person;
    initiative: number;
    gold: number; 
    inventory: Item[]; 
}

export interface Monster {
    id: string | number;
    name: string;
    description: string;
    hp: number;
    initiative: number;
    moves: MonsterMove[];
    attack(target: Monster): void;
    useMove(move: MonsterMove, target: Monster): void;
}