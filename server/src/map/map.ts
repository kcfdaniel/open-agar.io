import { isVisibleEntity } from "../lib/entityUtils";
import { FoodManager } from './food';
import { Virus, VirusConfig, VirusManager } from './virus';
import { MassFood, MassFoodManager } from './massFood';
import { Cell, Player, PlayerManager } from './player';
import { Food } from "./food";

interface MapConfig {
    foodMass: number;
    foodUniformDisposition: boolean;
    virus: VirusConfig;
}

interface PlayerData {
    x: number;
    y: number;
    cells: Cell[];
    massTotal: number;
    hue: number;
    id: string;
    name: string | null;
}

export class Map {
    food: FoodManager;
    viruses: VirusManager;
    massFood: MassFoodManager;
    players: PlayerManager;

    constructor(config: MapConfig) {
        this.food = new FoodManager(config.foodMass, config.foodUniformDisposition);
        this.viruses = new VirusManager(config.virus);
        this.massFood = new MassFoodManager();
        this.players = new PlayerManager();
    }

    balanceMass(foodMass: number, gameMass: number, maxFood: number, maxVirus: number): void {
        const totalMass = this.food.data.length * foodMass + this.players.getTotalMass();

        const massDiff = gameMass - totalMass;
        const foodFreeCapacity = maxFood - this.food.data.length;
        const foodDiff = Math.min(Math.floor(massDiff / foodMass), foodFreeCapacity);
        if (foodDiff > 0) {
            console.debug('[DEBUG] Adding ' + foodDiff + ' food');
            this.food.addNew(foodDiff);
        } else if (foodDiff && foodFreeCapacity !== maxFood) {
            console.debug('[DEBUG] Removing ' + -foodDiff + ' food');
            this.food.removeExcess(-foodDiff);
        }
        //console.debug('[DEBUG] Mass rebalanced!');

        const virusesToAdd = maxVirus - this.viruses.data.length;
        if (virusesToAdd > 0) {
            this.viruses.addNew(virusesToAdd);
        }
    }

    enumerateWhatPlayersSee(callback: (currentPlayer: PlayerData, visiblePlayers: PlayerData[], visibleFood: Food[], visibleMass: MassFood[], visibleViruses: Virus[]) => void): void {
        for (const currentPlayer of this.players.data) {
            const visibleFood = this.food.data.filter(entity => isVisibleEntity(entity, currentPlayer, false));
            const visibleViruses = this.viruses.data.filter(entity => isVisibleEntity(entity, currentPlayer));
            const visibleMass = this.massFood.data.filter(entity => isVisibleEntity(entity, currentPlayer));

            const extractData = (player: Player): PlayerData => {
                return {
                    x: player.x,
                    y: player.y,
                    cells: player.cells,
                    massTotal: Math.round(player.massTotal),
                    hue: player.hue,
                    id: player.id,
                    name: player.name
                };
            };

            const visiblePlayers: PlayerData[] = [];
            for (const player of this.players.data) {
                for (const cell of player.cells) {
                    if (isVisibleEntity(cell, currentPlayer)) {
                        visiblePlayers.push(extractData(player));
                        break;
                    }
                }
            }

            callback(extractData(currentPlayer), visiblePlayers, visibleFood, visibleMass, visibleViruses);
        }
    }
}
