import {Person} from "./Person";

export class Rogue extends Person {
    private stealth: number;

    constructor(hp: number, stealth: number, strength: number, agility: number, intelligence: number) {
        super(hp, strength, agility, intelligence);
        this.stealth = stealth;
    }

    public sneakAttack() {
        console.log("Наносит удар из тени!");
    }

    public increaseStealth(amount: number) {
        this.stealth += amount;
        console.log("Скрытность увеличена.");
    }
}