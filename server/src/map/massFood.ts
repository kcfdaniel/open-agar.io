import * as util from '../lib/util';
import SAT from 'sat';
import { Player } from './player';

export class MassFood {
    id: string;
    num: number;
    mass: number;
    hue: number;
    direction: SAT.Vector;
    x: number;
    y: number;
    radius: number;
    speed: number;

    constructor(playerFiring: Player, cellIndex: number, mass: number) {
        this.id = playerFiring.id;
        this.num = cellIndex;
        this.mass = mass;
        this.hue = playerFiring.hue;
        this.direction = new SAT.Vector(
            playerFiring.x - playerFiring.cells[cellIndex].x + playerFiring.target.x,
            playerFiring.y - playerFiring.cells[cellIndex].y + playerFiring.target.y
        ).normalize();
        this.x = playerFiring.cells[cellIndex].x;
        this.y = playerFiring.cells[cellIndex].y;
        this.radius = util.massToRadius(mass);
        this.speed = 25;
    }

    move(gameWidth: number, gameHeight: number): void {
        const deltaX = this.speed * this.direction.x;
        const deltaY = this.speed * this.direction.y;

        this.speed -= 0.5;
        if (this.speed < 0) {
            this.speed = 0;
        }
        if (!isNaN(deltaY)) {
            this.y += deltaY;
        }
        if (!isNaN(deltaX)) {
            this.x += deltaX;
        }

        util.adjustForBoundaries(this, this.radius, 5, gameWidth, gameHeight);
    }
}

export class MassFoodManager {
    data: MassFood[];

    constructor() {
        this.data = [];
    }

    addNew(playerFiring: Player, cellIndex: number, mass: number): void {
        this.data.push(new MassFood(playerFiring, cellIndex, mass));
    }

    move(gameWidth: number, gameHeight: number): void {
        for (const currentFood of this.data) {
            if (currentFood.speed > 0) currentFood.move(gameWidth, gameHeight);
        }
    }

    remove(indexes: number[]): void {
        if (indexes.length > 0) {
            this.data = util.removeIndexes(this.data, indexes);
        }
    }
}
