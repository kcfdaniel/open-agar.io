import * as util from '../lib/util';
import SAT from 'sat';

const MIN_SPEED = 6.25;
const SPLIT_CELL_SPEED = 20;
const SPEED_DECREMENT = 0.5;
const MIN_DISTANCE = 50;
const PUSHING_AWAY_SPEED = 1.1;
const MERGE_TIMER = 15;

interface Position {
    x: number;
    y: number;
}

export class Cell {
    x: number;
    y: number;
    mass: number;
    radius: number;
    speed: number;

    constructor(x: number, y: number, mass: number, speed: number) {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.radius = util.massToRadius(mass);
        this.speed = speed;
    }

    setMass(mass: number): void {
        this.mass = mass;
        this.recalculateRadius();
    }

    addMass(mass: number): void {
        this.setMass(this.mass + mass);
    }

    recalculateRadius(): void {
        this.radius = util.massToRadius(this.mass);
    }

    toCircle(): SAT.Circle {
        return new SAT.Circle(new SAT.Vector(this.x, this.y), this.radius);
    }

    move(playerX: number, playerY: number, playerTarget: Position, slowBase: number, initMassLog: number): void {
        const target = {
            x: playerX - this.x + playerTarget.x,
            y: playerY - this.y + playerTarget.y
        };
        const dist = Math.hypot(target.y, target.x);
        const deg = Math.atan2(target.y, target.x);
        let slowDown = 1;
        if (this.speed <= MIN_SPEED) {
            slowDown = util.mathLog(this.mass, slowBase) - initMassLog + 1;
        }

        let deltaY = this.speed * Math.sin(deg) / slowDown;
        let deltaX = this.speed * Math.cos(deg) / slowDown;

        if (this.speed > MIN_SPEED) {
            this.speed -= SPEED_DECREMENT;
        }
        if (dist < (MIN_DISTANCE + this.radius)) {
            deltaY *= dist / (MIN_DISTANCE + this.radius);
            deltaX *= dist / (MIN_DISTANCE + this.radius);
        }

        if (!isNaN(deltaY)) {
            this.y += deltaY;
        }
        if (!isNaN(deltaX)) {
            this.x += deltaX;
        }
    }

    static checkWhoAteWho(cellA: Cell | null, cellB: Cell | null): number {
        if (!cellA || !cellB) return 0;
        const response = new SAT.Response();
        const colliding = SAT.testCircleCircle(cellA.toCircle(), cellB.toCircle(), response);
        if (!colliding) return 0;
        if (response.bInA) return 1;
        if (response.aInB) return 2;
        return 0;
    }
}

export class Player {
    id: string;
    hue: number;
    name: string;
    admin: boolean;
    screenWidth: number;
    screenHeight: number;
    timeToMerge: number | null;
    lastHeartbeat: number;
    cells: Cell[];
    massTotal: number;
    x: number;
    y: number;
    ipAddress: string;
    target: Position;

    constructor(id: string, ipAddress: string) {
        this.id = id;
        this.ipAddress = ipAddress;
        this.hue = Math.round(Math.random() * 360);
        this.name = '';
        this.admin = false;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.timeToMerge = null;
        this.cells = [];
        this.massTotal = 0;
        this.x = 0;
        this.y = 0;
        this.target = { x: 0, y: 0 };
        this.lastHeartbeat = Date.now();
    }

    init(position: Position, defaultPlayerMass: number): void {
        this.cells = [new Cell(position.x, position.y, defaultPlayerMass, MIN_SPEED)];
        this.massTotal = defaultPlayerMass;
        this.x = position.x;
        this.y = position.y;
        this.target = { x: 0, y: 0 };
    }

    clientProvidedData(playerData: { name: string; screenWidth: number; screenHeight: number }): void {
        this.name = playerData.name;
        this.screenWidth = playerData.screenWidth;
        this.screenHeight = playerData.screenHeight;
        this.lastHeartbeat = Date.now();
    }

    setLastSplit(): void {
        this.timeToMerge = Date.now() + 1000 * MERGE_TIMER;
    }

    loseMassIfNeeded(massLossRate: number, defaultPlayerMass: number, minMassLoss: number): void {
        for (let i = 0; i < this.cells.length; i++) {
            if (this.cells[i].mass * (1 - (massLossRate / 1000)) > defaultPlayerMass && this.massTotal > minMassLoss) {
                const massLoss = this.cells[i].mass * (massLossRate / 1000);
                this.changeCellMass(i, -massLoss);
            }
        }
    }

    changeCellMass(cellIndex: number, massDifference: number): void {
        this.cells[cellIndex].addMass(massDifference);
        this.massTotal += massDifference;
    }

    removeCell(cellIndex: number): boolean {
        this.massTotal -= this.cells[cellIndex].mass;
        this.cells.splice(cellIndex, 1);
        return this.cells.length === 0;
    }

    splitCell(cellIndex: number, maxRequestedPieces: number, defaultPlayerMass: number): void {
        const cellToSplit = this.cells[cellIndex];
        const maxAllowedPieces = Math.floor(cellToSplit.mass / defaultPlayerMass);
        const piecesToCreate = Math.min(maxAllowedPieces, maxRequestedPieces);
        if (piecesToCreate === 0) {
            return;
        }
        const newCellsMass = cellToSplit.mass / piecesToCreate;
        for (let i = 0; i < piecesToCreate - 1; i++) {
            this.cells.push(new Cell(cellToSplit.x, cellToSplit.y, newCellsMass, SPLIT_CELL_SPEED));
        }
        cellToSplit.setMass(newCellsMass);
        this.setLastSplit();
    }

    virusSplit(cellIndexes: number[], maxCells: number, defaultPlayerMass: number): void {
        for (const cellIndex of cellIndexes) {
            this.splitCell(cellIndex, maxCells - this.cells.length + 1, defaultPlayerMass);
        }
    }

    userSplit(maxCells: number, defaultPlayerMass: number): void {
        let cellsToCreate: number;
        if (this.cells.length > maxCells / 2) {
            cellsToCreate = maxCells - this.cells.length + 1;
            this.cells.sort((a, b) => b.mass - a.mass);
        } else {
            cellsToCreate = this.cells.length;
        }

        for (let i = 0; i < cellsToCreate; i++) {
            this.splitCell(i, 2, defaultPlayerMass);
        }
    }

    enumerateCollidingCells(callback: (cells: Cell[], cellAIndex: number, cellBIndex: number) => void): void {
        for (let cellAIndex = 0; cellAIndex < this.cells.length; cellAIndex++) {
            const cellA = this.cells[cellAIndex];
            if (!cellA) continue;

            for (let cellBIndex = cellAIndex + 1; cellBIndex < this.cells.length; cellBIndex++) {
                const cellB = this.cells[cellBIndex];
                if (!cellB) continue;
                const colliding = SAT.testCircleCircle(cellA.toCircle(), cellB.toCircle());
                if (colliding) {
                    callback(this.cells, cellAIndex, cellBIndex);
                }
            }
        }

        this.cells = util.removeNulls(this.cells);
    }

    mergeCollidingCells(): void {
        this.enumerateCollidingCells((cells, cellAIndex, cellBIndex) => {
            cells[cellAIndex].addMass(cells[cellBIndex].mass);
            cells.splice(cellBIndex, 1);
        });
    }

    pushAwayCollidingCells(): void {
        this.enumerateCollidingCells((cells, cellAIndex, cellBIndex) => {
            const cellA = cells[cellAIndex];
            const cellB = cells[cellBIndex];
            let vector = new SAT.Vector(cellB.x - cellA.x, cellB.y - cellA.y);
            vector = vector.normalize().scale(PUSHING_AWAY_SPEED, PUSHING_AWAY_SPEED);
            if (vector.len() === 0) {
                vector = new SAT.Vector(0, 1);
            }

            cellA.x -= vector.x;
            cellA.y -= vector.y;

            cellB.x += vector.x;
            cellB.y += vector.y;
        });
    }

    move(slowBase: number, gameWidth: number, gameHeight: number, initMassLog: number): void {
        if (this.cells.length > 1) {
            if (this.timeToMerge && this.timeToMerge < Date.now()) {
                this.mergeCollidingCells();
            } else {
                this.pushAwayCollidingCells();
            }
        }

        let xSum = 0, ySum = 0;
        for (const cell of this.cells) {
            cell.move(this.x, this.y, this.target, slowBase, initMassLog);
            util.adjustForBoundaries(cell, cell.radius/3, 0, gameWidth, gameHeight);

            xSum += cell.x;
            ySum += cell.y;
        }
        this.x = xSum / this.cells.length;
        this.y = ySum / this.cells.length;
    }

    static checkForCollisions(
        playerA: Player,
        playerB: Player,
        playerAIndex: number,
        playerBIndex: number,
        callback: (eatenCell: { playerIndex: number; cellIndex: number }, eaterCell: { playerIndex: number; cellIndex: number }) => void
    ): void {
        for (let cellAIndex = 0; cellAIndex < playerA.cells.length; cellAIndex++) {
            for (let cellBIndex = 0; cellBIndex < playerB.cells.length; cellBIndex++) {
                const cellA = playerA.cells[cellAIndex];
                const cellB = playerB.cells[cellBIndex];

                const cellAData = { playerIndex: playerAIndex, cellIndex: cellAIndex };
                const cellBData = { playerIndex: playerBIndex, cellIndex: cellBIndex };

                const whoAteWho = Cell.checkWhoAteWho(cellA, cellB);

                if (whoAteWho === 1) {
                    callback(cellBData, cellAData);
                } else if (whoAteWho === 2) {
                    callback(cellAData, cellBData);
                }
            }
        }
    }
}

export class PlayerManager {
    data: Player[];

    constructor() {
        this.data = [];
    }

    pushNew(player: Player): void {
        this.data.push(player);
    }

    findIndexByID(id: string): number {
        return util.findIndex(this.data, id);
    }

    removePlayerByID(id: string): void {
        const index = this.findIndexByID(id);
        if (index > -1) {
            this.removePlayerByIndex(index);
        }
    }

    removePlayerByIndex(index: number): void {
        this.data.splice(index, 1);
    }

    shrinkCells(massLossRate: number, defaultPlayerMass: number, minMassLoss: number): void {
        for (const player of this.data) {
            player.loseMassIfNeeded(massLossRate, defaultPlayerMass, minMassLoss);
        }
    }

    removeCell(playerIndex: number, cellIndex: number): boolean {
        return this.data[playerIndex].removeCell(cellIndex);
    }

    getCell(playerIndex: number, cellIndex: number): Cell {
        return this.data[playerIndex].cells[cellIndex];
    }

    handleCollisions(callback: (eatenCell: { playerIndex: number; cellIndex: number }, eaterCell: { playerIndex: number; cellIndex: number }) => void): void {
        for (let playerAIndex = 0; playerAIndex < this.data.length; playerAIndex++) {
            for (let playerBIndex = playerAIndex + 1; playerBIndex < this.data.length; playerBIndex++) {
                Player.checkForCollisions(
                    this.data[playerAIndex],
                    this.data[playerBIndex],
                    playerAIndex,
                    playerBIndex,
                    callback
                );
            }
        }
    }

    getTopPlayers(): { id: string; name: string | null }[] {
        this.data.sort((a, b) => b.massTotal - a.massTotal);
        const topPlayers: { id: string; name: string | null }[] = [];
        for (let i = 0; i < Math.min(10, this.data.length); i++) {
            topPlayers.push({
                id: this.data[i].id,
                name: this.data[i].name
            });
        }
        return topPlayers;
    }

    getTotalMass(): number {
        return this.data.reduce((sum, player) => sum + player.massTotal, 0);
    }
}
