import { Player } from "../map/player";
import * as util from "./util";

interface Position {
    x: number;
    y: number;
}

interface Entity {
    x: number;
    y: number;
    radius: number;
}

export function getPosition(isUniform: boolean, radius: number, uniformPositions: Entity[]): Position {
    return isUniform ? util.uniformPosition(uniformPositions, radius) : util.randomPosition(radius);
}

export function isVisibleEntity(entity: Entity, player: Player, addThreshold: boolean = true): boolean {
    const entityHalfSize = entity.radius + (addThreshold ? entity.radius * 0.1 : 0);
    return util.testRectangleRectangle(
        entity.x, entity.y, entityHalfSize, entityHalfSize,
        player.x, player.y, player.screenWidth / 2, player.screenHeight / 2);
}
