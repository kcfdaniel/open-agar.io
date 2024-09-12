import { Socket } from 'socket.io-client';
import Canvas from './canvas';
import state from './state';
import { Player } from './types';
import { Key } from './constants';

interface Command {
    description: string;
    callback: (args: string[]) => void;
}

class ChatClient {
    private canvas: Canvas;
    socket: Socket;
    private mobile: boolean;
    player: Player;
    private commands: { [key: string]: Command };

    constructor() {
        this.canvas = state.canvas;
        this.socket = state.socket;
        this.mobile = state.mobile;
        this.player = state.player;
        this.commands = {};

        const input = document.getElementById('chatInput') as HTMLInputElement;
        input.addEventListener('keypress', this.sendChat.bind(this));
        input.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                input.value = '';
                this.canvas.cv.focus();
            }
        });

        state.chatClient = this;
    }

    registerFunctions(): void {
        this.registerCommand('ping', 'Check your latency.', () => {
            this.checkLatency();
        });

        this.registerCommand('dark', 'Toggle dark mode.', () => {
            this.toggleDarkMode();
        });

        this.registerCommand('border', 'Toggle visibility of border.', () => {
            this.toggleBorder();
        });

        this.registerCommand('mass', 'Toggle visibility of mass.', () => {
            this.toggleMass();
        });

        this.registerCommand('continuity', 'Toggle continuity.', () => {
            this.toggleContinuity();
        });

        this.registerCommand('roundfood', 'Toggle food drawing.', (args) => {
            this.toggleRoundFood(args);
        });

        this.registerCommand('help', 'Information about the chat commands.', () => {
            this.printHelp();
        });

        this.registerCommand('login', 'Login as an admin.', (args) => {
            this.socket.emit('pass', args);
        });

        this.registerCommand('kick', 'Kick a player, for admins only.', (args) => {
            this.socket.emit('kick', args);
        });

        state.chatClient = this;
    }

    addChatLine(name: string, message: string, me: boolean): void {
        if (this.mobile) {
            return;
        }
        const newline = document.createElement('li');

        newline.className = me ? 'me' : 'friend';
        newline.innerHTML = `<b>${name.length < 1 ? 'An unnamed cell' : name}</b>: ${message}`;

        this.appendMessage(newline);
    }

    addSystemLine(message: string): void {
        if (this.mobile) {
            return;
        }
        const newline = document.createElement('li');

        newline.className = 'system';
        newline.innerHTML = message;

        this.appendMessage(newline);
    }

    appendMessage(node: HTMLLIElement): void {
        if (this.mobile) {
            return;
        }
        const chatList = document.getElementById('chatList');
        if (chatList && chatList.childNodes.length > 10) {
            chatList.removeChild(chatList.childNodes[0]);
        }
        chatList?.appendChild(node);
    }

    sendChat(e: KeyboardEvent): void {
        const input = document.getElementById('chatInput') as HTMLInputElement;

        if (e.key === Key.Enter) {
            const text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {
                if (text.indexOf('-') === 0) {
                    const args = text.substring(1).split(' ');
                    if (this.commands[args[0]]) {
                        this.commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine(`Unrecognized Command: ${text}, type -help for more info.`);
                    }
                } else {
                    this.socket.emit('playerChat', { sender: this.player.name, message: text });
                    this.addChatLine(this.player.name, text, true);
                }

                input.value = '';
                this.canvas.cv.focus();
            }
        }
    }

    registerCommand(name: string, description: string, callback: (args: string[]) => void): void {
        this.commands[name] = {
            description,
            callback
        };
    }

    printHelp(): void {
        for (const cmd in this.commands) {
            if (Object.prototype.hasOwnProperty.call(this.commands, cmd)) {
                this.addSystemLine(`-${cmd}: ${this.commands[cmd].description}`);
            }
        }
    }

    checkLatency(): void {
        state.startPingTime = Date.now();
        this.socket.emit('pingcheck');
    }

    toggleDarkMode(): void {
        const LIGHT = '#f2fbff';
        const DARK = '#181818';
        const LINELIGHT = '#000000';
        const LINEDARK = '#ffffff';

        if (state.backgroundColor === LIGHT) {
            state.backgroundColor = DARK;
            state.lineColor = LINEDARK;
            this.addSystemLine('Dark mode enabled.');
        } else {
            state.backgroundColor = LIGHT;
            state.lineColor = LINELIGHT;
            this.addSystemLine('Dark mode disabled.');
        }
    }

    toggleBorder(): void {
        state.borderDraw = !state.borderDraw;
        this.addSystemLine(state.borderDraw ? 'Showing border.' : 'Hiding border.');
    }

    toggleMass(): void {
        state.toggleMassState = state.toggleMassState === 0 ? 1 : 0;
        this.addSystemLine(state.toggleMassState === 1 ? 'Viewing mass enabled.' : 'Viewing mass disabled.');
    }

    toggleContinuity(): void {
        state.continuity = !state.continuity;
        this.addSystemLine(state.continuity ? 'Continuity enabled.' : 'Continuity disabled.');
    }

    toggleRoundFood(args: string[]): void {
        console.log("toggleRoundFood");
        console.log({args});
        if (args.length > 0 || state.foodSides < 10) {
            state.foodSides = (args.length > 0 && !isNaN(Number(args[0])) && Number(args[0]) >= 3) ? Number(args[0]) : 10;
            this.addSystemLine('Food is now rounded!');
        } else {
            state.foodSides = 5;
            this.addSystemLine('Food is no longer rounded!');
        }
    }
}

export default ChatClient;
