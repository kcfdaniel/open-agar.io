import cfg from '../config';

interface Point {
    x: number;
    y: number;
    radius: number;
}

interface Position {
    x: number;
    y: number;
}

export function validNick(nickname: string): boolean {
    const regex = /^\w*$/;
    return regex.test(nickname);
}

export function massToRadius(mass: number): number {
    return 4 + Math.sqrt(mass) * 6;
}

export function mathLog(n: number, base?: number): number {
    return Math.log(n) / (base ? Math.log(base) : 1);
}

export function getDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
}

export function randomInRange(from: number, to: number): number {
    return Math.floor(Math.random() * (to - from)) + from;
}

export function randomPosition(radius: number): { x: number; y: number } {
    return {
        x: randomInRange(radius, cfg.gameWidth - radius),
        y: randomInRange(radius, cfg.gameHeight - radius)
    };
}

export function uniformPosition(points: Point[], radius: number): { x: number; y: number } {
    let bestCandidate: { x: number; y: number } | null = null;
    let maxDistance = 0;
    const numberOfCandidates = 10;

    if (points.length === 0) {
        return randomPosition(radius);
    }

    for (let ci = 0; ci < numberOfCandidates; ci++) {
        let minDistance = Infinity;
        const candidate = randomPosition(radius);

        for (const point of points) {
            const distance = getDistance({ ...candidate, radius }, point);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        if (minDistance > maxDistance) {
            bestCandidate = candidate;
            maxDistance = minDistance;
        } else {
            return randomPosition(radius);
        }
    }

    return bestCandidate || randomPosition(radius);
}

export function findIndex<T extends { id: string }>(arr: T[], id: string): number {
    return arr.findIndex(item => item.id === id);
}

interface Color {
    fill: string;
    border: string;
}

export function randomColor(): Color {
    const color = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
    const c = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (!c) {
        throw new Error('Invalid color generated');
    }
    const r = Math.max(parseInt(c[1], 16) - 32, 0);
    const g = Math.max(parseInt(c[2], 16) - 32, 0);
    const b = Math.max(parseInt(c[3], 16) - 32, 0);

    return {
        fill: color,
        border: '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    };
}

export function removeNulls<T>(inputArray: (T | null)[]): T[] {
    return inputArray.filter((element): element is T => element != null);
}

export function removeIndexes<T>(inputArray: T[], indexes: number[]): T[] {
    const nullified = inputArray.map((item, index) => indexes.includes(index) ? null : item);
    return removeNulls(nullified);
}

export function testRectangleRectangle(
    centerXA: number, centerYA: number, widthA: number, heightA: number,
    centerXB: number, centerYB: number, widthB: number, heightB: number
): boolean {
    return centerXA + widthA > centerXB - widthB
        && centerXA - widthA < centerXB + widthB
        && centerYA + heightA > centerYB - heightB
        && centerYA - heightA < centerYB + heightB;
}

export function testSquareRectangle(
    centerXA: number, centerYA: number, edgeLengthA: number,
    centerXB: number, centerYB: number, widthB: number, heightB: number
): boolean {
    return testRectangleRectangle(
        centerXA, centerYA, edgeLengthA, edgeLengthA,
        centerXB, centerYB, widthB, heightB);
}

export function getIndexes<T>(array: T[], predicate: (value: T) => boolean): number[] {
    return array.reduce((acc: number[], value, index) => {
        if (predicate(value)) {
            acc.push(index);
        }
        return acc;
    }, []);
}

export function adjustForBoundaries(position: Position, radius: number, borderOffset: number, gameWidth: number, gameHeight: number): void {
    const borderCalc = radius + borderOffset;
    if (position.x > gameWidth - borderCalc) {
        position.x = gameWidth - borderCalc;
    }
    if (position.y > gameHeight - borderCalc) {
        position.y = gameHeight - borderCalc;
    }
    if (position.x < borderCalc) {
        position.x = borderCalc;
    }
    if (position.y < borderCalc) {
        position.y = borderCalc;
    }
}