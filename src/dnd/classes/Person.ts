import { Item } from "../../types";  

export class Person {
    private maxHp: number;
    private hp: number;
    private strength: number;
    private agility: number;
    private intelligence: number;
    private initiative: number;
    private isblocking: boolean = false;
    private gold: number;
    private inventory: Item[];
    private armor: number;

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
        this.gold = 0;
        this.inventory = [];
        this.armor = 0;
    }

    // Gold Management
    public addGold(amount: number): void {
        this.gold += amount;
        console.log(`Gained ${amount} gold. Total gold: ${this.gold}`);
    }

    public subtractGold(amount: number): boolean {
        if (this.gold >= amount) {
            this.gold -= amount;
            console.log(`Spent ${amount} gold. Remaining gold: ${this.gold}`);
            return true;
        } else {
            console.log(`Not enough gold. Required: ${amount}, Available: ${this.gold}`);
            return false;
        }
    }

    public getGold(): number {
        return this.gold;
    }

    // Inventory Management
    public addItem(item: Item): void {
        this.inventory.push(item);
        console.log(`Added ${item.name} to inventory.`);
    }

    public setBlocking(status: boolean): void {
        this.isblocking = status;
    }
    
    public isBlocking(): boolean {
        return this.isblocking;
    }
    
    public useItem(itemId: number): void {
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const item = this.inventory[itemIndex];
            item.effect(this);  // Apply the item's effect to this person
            this.inventory.splice(itemIndex, 1);  // Remove the item after use
            console.log(`Used ${item.name}.`);
        } else {
            console.log(`Item with ID ${itemId} not found in inventory.`);
        }
    }

    public getInventory(): Item[] {
        return this.inventory;
    }

    // Stat Adjustments
    public restoreHpBy(amount: number): void {
        this.hp = Math.min(this.hp + amount, this.maxHp);
        console.log(`Restored ${amount} HP. Current HP: ${this.hp}`);
    }

    public increaseStrength(amount: number): void {
        this.strength += amount;
        console.log(`Strength increased by ${amount}. New strength: ${this.strength}`);
    }

    public increaseArmor(amount: number): void {
        this.armor += amount;
        console.log(`Armor increased by ${amount}. New armor: ${this.armor}`);
    }

    // Damage Calculation
    public damage(amount: number): void {
        const actualDamage = Math.max(0, amount - this.armor);
        this.hp -= actualDamage;
        if (this.hp < 0) this.hp = 0;
        console.log(`Person takes ${actualDamage} damage (original: ${amount}, armor: ${this.armor}). Remaining HP: ${this.hp}`);
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

    public getArmor(): number {
        return this.armor;
    }

    public toString(): string {
        return `HP: ${this.hp}/${this.maxHp}, Gold: ${this.gold}, Strength: ${this.strength}, Armor: ${this.armor}`;
    }
}