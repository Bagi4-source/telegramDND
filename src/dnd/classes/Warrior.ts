// src/dnd/classes/Warrior.ts

import { Person } from "./Person";

export class Warrior extends Person {
    constructor(
        maxHp: number,
        hp: number,
        strength: number,
        agility: number,
        intelligence: number,
        initiative: number
    ) {
        super(maxHp, hp, strength, agility, intelligence, initiative);
        // Warriors start with base armor
        this.increaseArmor(5);
    }

    public hasArmor(): boolean {
        return this.getArmor() > 0;
    }

    public toString(): string {
        return `Warrior: ${super.toString()}`;
    }
}
