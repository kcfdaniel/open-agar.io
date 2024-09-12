import { Socket } from 'socket.io-client';
import { Key } from './constants';
import state from './state';

class Canvas {
    private directionLock: boolean;
    target: { x: number; y: number };
    reenviar: boolean;
    socket: Socket; // Consider using a more specific type for socket
    private directions: string[];
    cv: HTMLCanvasElement;

    constructor() {
        this.directionLock = false;
        this.target = state.target;
        this.reenviar = true;
        this.socket = state.socket;
        this.directions = [];

        this.cv = document.getElementById('cvs') as HTMLCanvasElement;
        if (!this.cv) throw new Error('Element not found');
        
        this.cv.width = state.screen.width;
        this.cv.height = state.screen.height;
        this.cv.addEventListener('mousemove', this.gameInput.bind(this), false);
        this.cv.addEventListener('mouseout', this.outOfBounds.bind(this), false);
        this.cv.addEventListener('keypress', this.keyInput.bind(this), false);
        this.cv.addEventListener('keyup', (event: KeyboardEvent) => {
            this.reenviar = true;
            this.directionUp(event);
        }, false);
        this.cv.addEventListener('keydown', this.directionDown.bind(this), false);
        this.cv.addEventListener('touchstart', this.touchInput.bind(this), false);
        this.cv.addEventListener('touchmove', this.touchInput.bind(this), false);

        state.canvas = this;
    }

    // Function called when a key is pressed, will change direction if arrow key.
    directionDown(e: KeyboardEvent) {
    	if (this.directional(e.key)) {
    		this.directionLock = true;
    		if (this.newDirection(e.key, this.directions, true)) {
    			this.updateTarget(this.directions);
    			this.socket.emit('0', this.target);
    		}
    	}
    }

    // Function called when a key is lifted, will change direction if arrow key.
    directionUp(e: KeyboardEvent) {
    	if (this.directional(e.key)) { // this == the actual class
    		if (this.newDirection(e.key, this.directions, false)) {
    			this.updateTarget(this.directions);
    			if (this.directions.length === 0) this.directionLock = false;
    			this.socket.emit('0', this.target);
    		}
    	}
    }

    // Updates the direction array including information about the new direction.
    newDirection(direction: string, list: string[], isAddition: boolean) {
    	let result = false;
    	let found = false;
    	for (let i = 0, len = list.length; i < len; i++) {
    		if (list[i] == direction) {
    			found = true;
    			if (!isAddition) {
    				result = true;
    				// Removes the direction.
    				list.splice(i, 1);
    			}
    			break;
    		}
    	}
    	// Adds the direction.
    	if (isAddition && found === false) {
    		result = true;
    		list.push(direction);
    	}

    	return result;
    }

    // Updates the target according to the directions in the directions array.
    private updateTarget(list: string[]): void {
        this.target = { x: 0, y: 0 };
        let directionHorizontal = 0;
        let directionVertical = 0;
        for (let i = 0, len = list.length; i < len; i++) {
            if (directionHorizontal === 0) {
                if (list[i] === "ArrowLeft") directionHorizontal -= Number.MAX_VALUE;
                else if (list[i] === "ArrowRight") directionHorizontal += Number.MAX_VALUE;
            }
            if (directionVertical === 0) {
                if (list[i] === "ArrowUp") directionVertical -= Number.MAX_VALUE;
                else if (list[i] === "ArrowDown") directionVertical += Number.MAX_VALUE;
            }
        }
        this.target.x += directionHorizontal;
        this.target.y += directionVertical;
        state.target = this.target;
    }

    private directional(key: string): boolean {
        return this.horizontal(key) || this.vertical(key);
    }

    private horizontal(key: string): boolean {
        return key === Key.ArrowLeft || key === Key.ArrowRight;
    }

    private vertical(key: string): boolean {
        return key === Key.ArrowDown || key === Key.ArrowUp;
    }

    // Register when the mouse goes off the canvas.
    outOfBounds() {
        if (!state.continuity) {
            this.target = { x : 0, y: 0 };
            state.target = this.target;
        }
    }

    gameInput(e: MouseEvent) {
    	if (!this.directionLock) {
    		this.target.x = e.clientX - this.cv.width / 2;
    		this.target.y = e.clientY - this.cv.height / 2;
            state.target = this.target;
    	}
    }

    touchInput(e: TouchEvent) {
        e.preventDefault();
        e.stopPropagation();
    	if (!this.directionLock) {
    		this.target.x = e.touches[0].clientX - this.cv.width / 2;
    		this.target.y = e.touches[0].clientY - this.cv.height / 2;
            state.target = this.target;
    	}
    }

    // Chat command callback functions.
    keyInput(e: KeyboardEvent) {
    	if (e.key === Key.F8 && this.reenviar) {
            this.socket.emit('1');
            this.reenviar = false;
        }
        else if (e.key === Key.Space && this.reenviar) {
            const splitCell = document.getElementById('split_cell') as HTMLAudioElement;
            splitCell.play();
            this.socket.emit('2');
            this.reenviar = false;
        }
        else if (e.key === Key.Enter) {
            const chatInput = document.getElementById('chatInput') as HTMLInputElement;
            chatInput.focus();
        }
    }
}

export default Canvas;
