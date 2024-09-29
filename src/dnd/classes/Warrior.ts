import {Person} from "./Person";

export class Warrior extends Person {
    private armor: number;

    constructor(hp: number, armor: number, strength: number, agility: number, intelligence: number, initiative: number) {
        super(hp, strength, agility, intelligence, initiative);
        this.armor = armor;
    }

    public defend(damage: number) {
        const effectiveDamage = Math.max(damage - this.armor, 0);
        this.damage(effectiveDamage);
        console.log(`Получен урон: ${effectiveDamage}.`);
    }

    public increaseArmor(amount: number) {
        this.armor += amount;
        console.log("Броня увеличена.");
    }

    public toString() {
        return `Warrior: ${super.toString()}, Armor: ${this.armor}`;
    }
}