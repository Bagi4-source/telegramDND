import {Person} from "./Person";

export class Mage extends Person {
    private mana: number;
    private readonly maxMana: number;

    constructor(hp: number, mana: number, strength: number, agility: number, intelligence: number) {
        super(hp, strength, agility, intelligence);
        this.maxMana = mana;
        this.mana = mana;
    }

    public castSpell(cost: number) {
        if (this.mana >= cost) {
            this.mana -= cost;
            console.log("Заклинание успешно применено.");
        } else {
            console.log("Недостаточно маны для заклинания.");
        }
    }

    public regenerateMana(amount: number) {
        this.mana = Math.min(this.mana + amount, this.maxMana);
    }

    public toString() {
        return `Маг: ${super.toString()}, Мана: ${this.mana}/${this.maxMana}`;
    }
}