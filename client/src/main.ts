import { io, Socket } from 'socket.io-client';
import * as render from './render';
import ChatClient from './chat-client';
import Canvas from './canvas';
import state from './state';
import { Cell, Food, Mass, Player, Virus } from './types';

const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
const settings = document.getElementById('settings') as HTMLDivElement;
const chat = new ChatClient();
const canvas = new Canvas();
let socket: Socket;


if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    state.mobile = true;
}

const startGame = (type: string): void => {
    state.playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '').substring(0, 25);
    state.playerType = type;

    state.screen.width = window.innerWidth;
    state.screen.height = window.innerHeight;

    const startMenuWrapper = document.getElementById('startMenuWrapper') as HTMLElement;
    const gameAreaWrapper = document.getElementById('gameAreaWrapper') as HTMLElement;
    startMenuWrapper.style.maxHeight = '0px';
    gameAreaWrapper.style.opacity = '1';
    if (!socket) {
        socket = io("http://0.0.0.0:3000", { query: {type: type }});
        setupSocket(socket);
    }
    if (!state.animLoopHandle)
        animloop();
    socket.emit('respawn');
    chat.socket = socket;
    chat.registerFunctions();
    canvas.socket = socket;
    state.socket = socket;
};

// Checks if the nick chosen contains valid alphanumeric characters (and underscores).
const validNick = (): boolean => {
    const regex = /^\w*$/;
    console.log('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
};

window.onload = (): void => {

    const startButton = document.getElementById('startButton') as HTMLElement;
    const spectateButton = document.getElementById('spectateButton') as HTMLElement;
    const nickErrorText = document.querySelector('#startMenu .input-error') as HTMLElement;
    const settingsMenu = document.getElementById('settingsButton') as HTMLElement;

    spectateButton.onclick = (): void => {
        startGame('spectator');
    };

    startButton.onclick = (): void => {

        // Checks if the nick is valid.
        if (validNick()) {
            nickErrorText.style.opacity = '0';
            startGame('player');
        } else {
            nickErrorText.style.opacity = '1';
        }
    };

    settingsMenu.onclick = (): void => {
        if (settings.style.maxHeight == '300px') {
            settings.style.maxHeight = '0px';
        } else {
            settings.style.maxHeight = '300px';
        }
    };

    playerNameInput.addEventListener('keypress', (e: KeyboardEvent): void => {
        if (e.key === "Enter") {
            if (validNick()) {
                nickErrorText.style.opacity = '0';
                startGame('player');
            } else {
                nickErrorText.style.opacity = '1';
            }
        }
    });
};

// TODO: Break out into GameControls.

const playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

let player: Player = {
    id: -1,
    x: state.screen.width / 2,
    y: state.screen.height / 2,
    screenWidth: state.screen.width,
    screenHeight: state.screen.height,
    target: { x: state.screen.width / 2, y: state.screen.height / 2 },
    name: "",
    cells: [],
    hue: 0,
    massTotal: 0
};
state.player = player;

let foods: Food[] = [];
let viruses: Virus[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fireFood: any[] = [];
let users: Player[] = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let leaderboard: any[] = [];
const target = { x: player.x, y: player.y };
state.target = target;

const visibleBorderSetting = document.getElementById('visBord') as HTMLInputElement;
visibleBorderSetting.onchange = chat.toggleBorder;

const showMassSetting = document.getElementById('showMass') as HTMLInputElement;
showMassSetting.onchange = chat.toggleMass;

const continuitySetting = document.getElementById('continuity') as HTMLInputElement;
continuitySetting.onchange = chat.toggleContinuity;

const roundFoodSetting = document.getElementById('roundFood') as HTMLInputElement;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
roundFoodSetting.onchange = (e: any) => chat.toggleRoundFood(e);

const c = canvas.cv;
const graph = c.getContext('2d') as CanvasRenderingContext2D;

document.getElementById("feed")?.addEventListener("click", () => {
    socket.emit('1');
    canvas.reenviar = false;
});

document.getElementById("split")?.addEventListener("click", () => {
    socket.emit('2');
    canvas.reenviar = false;
});

const handleDisconnect = (): void => {
    socket.close();
    if (!state.kicked) { // We have a more specific error message 
        render.drawErrorMessage('Disconnected!', graph, state.screen);
    }
};

// socket stuff.
const setupSocket = (socket: Socket): void => {
    // Handle ping.
    socket.on('pongcheck', () => {
        const latency = Date.now() - state.startPingTime;
        console.log('Latency: ' + latency + 'ms');
        chat.addSystemLine('Ping: ' + latency + 'ms');
    });

    // Handle error.
    socket.on('connect_error', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // Handle connection.
    socket.on('welcome', (playerSettings, gameSizes) => {
        player = playerSettings;
        player.name = state.playerName;
        player.screenWidth = state.screen.width;
        player.screenHeight = state.screen.height;
        player.target = canvas.target;
        state.player = player;
        chat.player = player;
        socket.emit('gotit', player);
        state.gameStart = true;
        chat.addSystemLine('Connected to the game!');
        chat.addSystemLine('Type <b>-help</b> for a list of commands.');
        if (state.mobile) {
            const gameAreaWrapper = document.getElementById('gameAreaWrapper') as HTMLDivElement;
            const chatbox = document.getElementById('chatbox') as HTMLDivElement;
            gameAreaWrapper.removeChild(chatbox);
        }
        c.focus();
        state.game.width = gameSizes.width;
        state.game.height = gameSizes.height;
        resize();
    });

    socket.on('playerDied', (data) => {
        const player = isUnnamedCell(data.playerEatenName) ? 'An unnamed cell' : data.playerEatenName;
        //const killer = isUnnamedCell(data.playerWhoAtePlayerName) ? 'An unnamed cell' : data.playerWhoAtePlayerName;

        //chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten by <b>' + (killer) + '</b>');
        chat.addSystemLine('{GAME} - <b>' + (player) + '</b> was eaten');
    });

    socket.on('playerDisconnect', (data) => {
        chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> disconnected.');
    });

    socket.on('playerJoin', (data) => {
        chat.addSystemLine('{GAME} - <b>' + (isUnnamedCell(data.name) ? 'An unnamed cell' : data.name) + '</b> joined.');
    });

    socket.on('leaderboard', (data) => {
        leaderboard = data.leaderboard;
        let status = '<span class="title">Leaderboard</span>';
        for (let i = 0; i < leaderboard.length; i++) {
            status += '<br />';
            if (leaderboard[i].id == player.id) {
                if (leaderboard[i].name.length !== 0)
                    status += '<span class="me">' + (i + 1) + '. ' + leaderboard[i].name + "</span>";
                else
                    status += '<span class="me">' + (i + 1) + ". An unnamed cell</span>";
            } else {
                if (leaderboard[i].name.length !== 0)
                    status += (i + 1) + '. ' + leaderboard[i].name;
                else
                    status += (i + 1) + '. An unnamed cell';
            }
        }
        //status += '<br />Players: ' + data.players;
        const statusElement = document.getElementById('status') as HTMLElement;
        statusElement.innerHTML = status;
    });

    socket.on('serverMSG', (data) => {
        chat.addSystemLine(data);
    });

    // Chat.
    socket.on('serverSendPlayerChat', (data) => {
        chat.addChatLine(data.sender, data.message, false);
    });

    // Handle movement.
    socket.on('serverTellPlayerMove', (playerData: Player, userData: Player[], foodsList: Food[], massList: Mass[], virusList: Virus[]) => {
        if (state.playerType == 'player') {
            player.x = playerData.x;
            player.y = playerData.y;
            player.hue = playerData.hue;
            player.massTotal = playerData.massTotal;
            player.cells = playerData.cells;
        }
        users = userData;
        foods = foodsList;
        viruses = virusList;
        fireFood = massList;
    });

    // Death.
    socket.on('RIP', () => {
        state.gameStart = false;
        render.drawErrorMessage('You died!', graph, state.screen);
        window.setTimeout(() => {
            const gameAreaWrapper = document.getElementById('gameAreaWrapper') as HTMLDivElement;
            const startMenuWrapper = document.getElementById('startMenuWrapper') as HTMLDivElement;
            gameAreaWrapper.style.opacity = '0';
            startMenuWrapper.style.maxHeight = '1000px';
            if (state.animLoopHandle) {
                window.cancelAnimationFrame(state.animLoopHandle);
                state.animLoopHandle = undefined;
            }
        }, 2500);
    });

    socket.on('kick', (reason) => {
        state.gameStart = false;
        state.kicked = true;
        if (reason !== '') {
            render.drawErrorMessage('You were kicked for: ' + reason, graph, state.screen);
        }
        else {
            render.drawErrorMessage('You were kicked!', graph, state.screen);
        }
        socket.close();
    });
};

const isUnnamedCell = (name: string): boolean => name.length < 1;

const getPosition = (entity: Food | Mass | Virus, player: Player, screen: typeof state.screen): { x: number, y: number } => {
    return {
        x: entity.x - player.x + screen.width / 2,
        y: entity.y - player.y + screen.height / 2
    }
};

const animloop = (): void => {
    state.animLoopHandle = requestAnimationFrame(animloop);
    gameLoop();
};

const gameLoop = (): void => {
    if (state.gameStart) {
        graph.fillStyle = state.backgroundColor;
        graph.fillRect(0, 0, state.screen.width, state.screen.height);

        render.drawGrid(player, state.screen, graph);
        foods.forEach(food => {
            const position = getPosition(food, player, state.screen);
            render.drawFood(position, food, graph);
        });
        fireFood.forEach(fireFood => {
            const position = getPosition(fireFood, player, state.screen);
            render.drawFireFood(position, fireFood, playerConfig, graph);
        });
        viruses.forEach(virus => {
            const position = getPosition(virus, player, state.screen);
            render.drawVirus(position, virus, graph);
        });


        const borders = { // Position of the borders on the screen
            left: state.screen.width / 2 - player.x,
            right: state.screen.width / 2 + state.game.width - player.x,
            top: state.screen.height / 2 - player.y,
            bottom: state.screen.height / 2 + state.game.height - player.y
        };
        if (state.borderDraw) {
            render.drawBorder(borders, graph);
        }

        const cellsToDraw: Cell[] = [];
        for (let i = 0; i < users.length; i++) {
            const color = 'hsl(' + users[i].hue + ', 100%, 50%)';
            const borderColor = 'hsl(' + users[i].hue + ', 100%, 45%)';
            for (let j = 0; j < users[i].cells.length; j++) {
                cellsToDraw.push({
                    color: color,
                    borderColor: borderColor,
                    mass: users[i].cells[j].mass,
                    name: users[i].name,
                    radius: users[i].cells[j].radius,
                    x: users[i].cells[j].x - player.x + state.screen.width / 2,
                    y: users[i].cells[j].y - player.y + state.screen.height / 2
                });
            }
        }
        cellsToDraw.sort((obj1, obj2) => obj1.mass - obj2.mass);
        render.drawCells(cellsToDraw, playerConfig, state.toggleMassState, borders, graph);

        socket.emit('0', canvas.target); // playerSendTarget "Heartbeat".
    }
};

const resize = (): void => {
    if (!socket) return;

    player.screenWidth = c.width = state.screen.width = state.playerType == 'player' ? window.innerWidth : state.game.width;
    player.screenHeight = c.height = state.screen.height = state.playerType == 'player' ? window.innerHeight : state.game.height;

    if (state.playerType == 'spectator') {
        player.x = state.game.width / 2;
        player.y = state.game.height / 2;
    }

    socket.emit('windowResized', { screenWidth: state.screen.width, screenHeight: state.screen.height });
};

window.addEventListener('resize', resize);

// Export necessary functions/variables
export { startGame, validNick };
