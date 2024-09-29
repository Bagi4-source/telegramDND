import {Person} from "./dnd/classes";
import { MonsterMove } from "./dnd/monsters/MonsterMoves";
export interface GameState {
    players: { [key: string | number]: Player };
    turnOrder: (string | number)[];
    currentTurn: number;
}

export interface Player {
    id: string | number;
    name: string;
    person: Person;
    initiative: number;
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

