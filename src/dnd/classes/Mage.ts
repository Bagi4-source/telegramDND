import {Person} from "./Person";

export class Mage extends Person {
    private mana: number;
    private readonly maxMana: number;

    constructor(maxhp : number , hp: number, mana: number, strength: number, agility: number, intelligence: number, initiative: number) {
        super(maxhp, hp, strength, agility, intelligence, initiative);
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
        return `Mage: ${super.toString()}, Mana: ${this.mana}/${this.maxMana}`;
    }
}