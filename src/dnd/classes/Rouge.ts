import {Person} from "./Person";

export class Rogue extends Person {
    private stealth: number;

    constructor(hp: number, stealth: number, strength: number, agility: number, intelligence: number, initiative: number) {
        super(hp, strength, agility, intelligence, initiative);
        this.stealth = stealth;
    }

    public sneakAttack() {
        console.log("Наносит удар из тени!");
    }

    public increaseStealth(amount: number) {
        this.stealth += amount;
        console.log("Скрытность увеличена.");
    }

    public toString() {
        return `Rouge: ${super.toString()}, Stealth: ${this.stealth}`;
    }
}