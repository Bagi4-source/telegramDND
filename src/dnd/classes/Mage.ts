import { Person } from "./Person";

export class Mage extends Person {
    private mana: number;
    private maxMana: number;

    constructor(
        maxHp: number,
        hp: number,
        mana: number,
        strength: number,
        agility: number,
        intelligence: number,
        initiative: number
    ) {
        super(maxHp, hp, strength, agility, intelligence, initiative);
        this.mana = mana;
        this.maxMana = mana;
    }

    public getMana(): number {
        return this.mana;
    }

    public useMana(amount: number): boolean {
        if (this.mana >= amount) {
            this.mana -= amount;
            console.log(`Used ${amount} mana. Remaining mana: ${this.mana}`);
            return true;
        } else {
            console.log(`Not enough mana. Required: ${amount}, Available: ${this.mana}`);
            return false;
        }
    }

    public regenerateMana(amount: number): void {
        this.mana = Math.min(this.mana + amount, this.maxMana);
        console.log(`Regenerated ${amount} mana. Current mana: ${this.mana}`);
    }

    // Add the missing method
    public increaseIntelligence(amount: number): void {
        super.increaseArmor(amount);
    }

    // Override toString to include mana
    public toString(): string {
        return `Mage: ${super.toString()}, Mana: ${this.mana}/${this.maxMana}`;
    }
}