export class Person {
    private readonly maxHp: number;
    protected hp: number;

    constructor(hp: number) {
        this.maxHp = hp;
        this.hp = hp;
    }

    public heal(hp: number) {
        this.hp = Math.min(this.hp + hp, this.maxHp);
    }

    public damage(hp: number) {
        if (this.hp - hp < 0) {
            this.dead()
        } else {
            this.hp -= hp;
        }
    }

    public dead() {
        // toDo(сдох)
    }
}