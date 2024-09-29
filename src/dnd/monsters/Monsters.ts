import { Person } from './Person';  
import { MonsterMove } from './MonsterMoves';  // Import MonsterMove interface

export class Monster {
    private readonly maxHp: number;
    protected hp: number;
    protected strength: number;
    protected agility: number;
    protected intelligence: number;
    protected initiative: number;
    protected description: string;
    protected moves: MonsterMove[];

    constructor(
        hp: number,
        strength: number,
        agility: number,
        intelligence: number,
        initiative: number,
        description: string,
        moves: MonsterMove[]
    ) {
        this.maxHp = hp;
        this.hp = hp;
        this.strength = strength;
        this.agility = agility;
        this.intelligence = intelligence;
        this.initiative = initiative;
        this.description = description;
        this.moves = moves;
    }

    public takeDamage(hp: number) {
        if (this.hp - hp <= 0) {
            this.hp = 0;
            this.dead();
        } else {
            this.hp -= hp;
            console.log(`${this.description} takes ${hp} damage. Remaining HP: ${this.hp}`);
        }
    }

    public dead() {
        console.log(`${this.description} is dead.`);
    }

    public attack(target: Person): void {
        const damage = this.strength; // A base attack based on strength
        target.takeDamage(damage);
        console.log(`${this.description} attacks ${target.toString()} for ${damage} damage.`);
    }

    public useMove(move: MonsterMove, target: Person): void {
        target.takeDamage(move.damage);
        console.log(`${this.description} uses ${move.name} on ${target.toString()} for ${move.damage} damage. ${move.description}`);
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

    public getInitiative() {
        return this.initiative;
    }

    public getDescription() {
        return this.description;
    }

    // String representation of the monster
    public toString() {
        return `Monster: ${this.description} | HP: ${this.hp}/${this.maxHp} | Strength: ${this.strength} | Agility: ${this.agility} | Intelligence: ${this.intelligence} | Initiative: ${this.initiative}`;
    }
}
