import {Person} from "./dnd/classes";
import { Monster, MonsterMove } from "./dnd/monsters/Monsters";

export interface Item {
    id: number;
    name: string;
    description: string;
    type: string;  // e.g., 'potion', 'weapon', 'armor'
    value: number;  // Cost of the item
    effect: (person: Person) => void;  // Function that applies the item's effect
}


export interface GameState {
    players: { [id: number]: Player };
    turnOrder: number[];
    currentTurn: number;
    currentMonster: Monster | null; 
}

export interface Player {
    id: number;
    name: string;
    person: Person;
    initiative: number;
    gold: number;          
    inventory: Item[];     
}

