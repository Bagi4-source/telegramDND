
import { Person } from "./Person";

export class Rogue extends Person {
    private stealth: number;

    constructor(
        maxHp: number,
        hp: number,
        strength: number,
        agility: number,
        intelligence: number,
        initiative: number
    ) {
        super(maxHp, hp, strength, agility, intelligence, initiative);
        this.stealth = agility;  // Stealth is based on agility
    }

    public getStealth(): number {
        return this.stealth;
    }

    public increaseStealth(amount: number): void {
        this.stealth += amount;
        console.log(`Stealth increased by ${amount}. New stealth: ${this.stealth}`);
    }

    public toString(): string {
        return `Rogue: ${super.toString()}, Stealth: ${this.stealth}`;
    }
}