import {Person} from "./dnd/classes";

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