import SAT from 'sat';

export type Position = {
    x: number;
    y: number;
}

export type Food = {
    id: string;
    x: number;
    y: number;
    hue: number;
    radius: number;
    mass: number;
}

export type Virus = {
    id: string;
    x: number;
    y: number;
    stroke: string;
    fill: string;
    strokeWidth: number;
    radius: number;
    mass: number;
}

export type Mass = {
    hue: number;
    radius: number;
    id: number;
    num: number;
    mass: number;
    direction: SAT.Vector;
    x: number;
    y: number;
    speed: number;
}

export type PlayerConfig = {
    border: number;
    textBorderSize: number;
    textColor: string;
    textBorder: string;
}

export type Cell = {
    x: number;
    y: number;
    radius: number;
    mass: number;
    color: string;
    borderColor: string;
    name: string;
}

export type Borders = {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export type Screen = {
    width: number;
    height: number;
}

export type Player = {
    id: number;
    cells: Cell[];
    x: number;
    y: number;
    hue: number;
    massTotal: number;
    screenWidth: number;
    screenHeight: number;
    name: string;
    target: { x: number, y: number };
};