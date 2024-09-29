export class Person {
    private readonly maxHp: number;
    protected hp: number;
    protected strength: number;  // Сила
    protected agility: number;    // Ловкость
    protected intelligence: number; // Интеллект

    constructor(hp: number, strength: number, agility: number, intelligence: number) {
        this.maxHp = hp;
        this.hp = hp;
        this.strength = strength;
        this.agility = agility;
        this.intelligence = intelligence;
    }

    public heal(hp: number) {
        this.hp = Math.min(this.hp + hp, this.maxHp);
    }

    public damage(hp: number) {
        if (this.hp - hp < 0) {
            this.dead();
        } else {
            this.hp -= hp;
        }
    }

    public dead() {
        console.log("Персонаж мертв.");
    }

    public getHp() {
        return this.hp;
    }

    public getStrength() {
        return this.strength;
    }

    public getAgility() {
        return this.agility;
    }

    public getIntelligence() {
        return this.intelligence;
    }

    public toString() {
        return `HP: ${this.hp}/${this.maxHp}, Сила: ${this.strength}, Ловкость: ${this.agility}, Интеллект: ${this.intelligence}`;
    }
}