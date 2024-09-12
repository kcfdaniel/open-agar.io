import { randomInRange, massToRadius } from '../lib/util';
import { v4 as uuidv4 } from 'uuid';
import { getPosition } from "../lib/entityUtils";

export interface VirusConfig {
    fill: string;
    stroke: string;
    strokeWidth: number;
    defaultMass: {
        from: number;
        to: number;
    };
    uniformDisposition: boolean;
}

interface Position {
    x: number;
    y: number;
}

export class Virus {
    id: string;
    x: number;
    y: number;
    radius: number;
    mass: number;
    fill: string;
    stroke: string;
    strokeWidth: number;

    constructor(position: Position, radius: number, mass: number, config: VirusConfig) {
        this.id = uuidv4();
        this.x = position.x;
        this.y = position.y;
        this.radius = radius;
        this.mass = mass;
        this.fill = config.fill;
        this.stroke = config.stroke;
        this.strokeWidth = config.strokeWidth;
    }
}

export class VirusManager {
    data: Virus[];
    private virusConfig: VirusConfig;

    constructor(virusConfig: VirusConfig) {
        this.data = [];
        this.virusConfig = virusConfig;
    }

    pushNew(virus: Virus): void {
        this.data.push(virus);
    }

    addNew(number: number): void {
        while (number--) {
            const mass = randomInRange(this.virusConfig.defaultMass.from, this.virusConfig.defaultMass.to);
            const radius = massToRadius(mass);
            const position = getPosition(this.virusConfig.uniformDisposition, radius, this.data);
            const newVirus = new Virus(position, radius, mass, this.virusConfig);
            this.pushNew(newVirus);
        }
    }

    delete(virusCollision: number): void {
        this.data.splice(virusCollision, 1);
    }
}
