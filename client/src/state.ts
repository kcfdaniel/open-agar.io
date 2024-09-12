import { Socket } from "socket.io-client";
import Canvas from "./canvas";
import { Player } from "./types";
import ChatClient from "./chat-client";

type State = {
    borderDraw: boolean;
    mobile: boolean;
    screen: {
        width: number;
        height: number;
    };
    game: {
        width: number;
        height: number;
    };
    gameStart: boolean;
    disconnected: boolean;
    kicked: boolean;
    continuity: boolean;
    startPingTime: number;
    toggleMassState: number;
    backgroundColor: string;
    lineColor: string;
    target: { x: number; y: number };
    foodSides: number;
    playerName: string;
    playerType: string;
    animLoopHandle?: number;
    socket: Socket;
    canvas: Canvas;
    player: Player;
    chatClient: ChatClient;
}

export default {
    // Keys and other mathematical constants
    borderDraw: false,
    mobile: false,
    // Canvas
    screen: {
        width: window.innerWidth,
        height: window.innerHeight
    },
    game: {
        width: 0,
        height: 0
    },
    gameStart: false,
    disconnected: false,
    kicked: false,
    continuity: false,
    startPingTime: 0,
    toggleMassState: 0,
    backgroundColor: '#f2fbff',
    lineColor: '#000000',
    target: { x: 0, y: 0 },
} as State;
