// src/classes/Person.ts

export class Person {
    private maxHp: number;
    private hp: number;
    private strength: number;
    private agility: number;
    private intelligence: number;
    private initiative: number;

    constructor(
        maxHp: number,
        hp: number,
        strength: number,
        agility: number,
        intelligence: number,
        initiative: number
    ) {
        this.maxHp = maxHp;
        this.hp = hp;
        this.strength = strength;
        this.agility = agility;
        this.intelligence = intelligence;
        this.initiative = initiative;
    }

    public damage(amount: number): void {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        console.log(`Person takes ${amount} damage. Remaining HP: ${this.hp}`);
    }

    public restoreHp(): void {
        this.hp = this.maxHp;
        console.log(`Person restores to full HP: ${this.hp}`);
    }

    public getHp(): number {
        return this.hp;
    }

    public getMaxHp(): number {
        return this.maxHp;
    }

    public getStrength(): number {
        return this.strength;
    }

    public getAgility(): number {
        return this.agility;
    }

    public getIntelligence(): number {
        return this.intelligence;
    }

    public getInitiative(): number {
        return this.initiative;
    }

    public toString(): string {
        return `HP: ${this.hp}/${this.maxHp}`;
    }
}
