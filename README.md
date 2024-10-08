Open Agar.io
=============

Open source Agar.io, with Node, Vite and Typescript.

A simple but powerful Agar.IO clone built with socket.IO and HTML5 canvas on top of NodeJS.

![Image](screenshot.png)

---

## How to Play

#### Game Basics
- Move your mouse around the screen to move your cell.
- Eat food and other players in order to grow your character (food respawns every time a player eats it).
- A player's **mass** is the number of food particles eaten.
- **Objective**: Try to get as big as possible and eat other players.

#### Gameplay Rules
- Players who haven't eaten yet cannot be eaten as a sort of "grace" period. This invincibility fades once they gain mass.
- Everytime a player joins the game, **3** food particles will spawn.
- Everytime a food particle is eaten by a player, **1** new food particle will respawn.
- The more food you eat, the slower you move to make the game fairer for all.

---

## Latest Changes
- Game logic is handled by the server
- The client side is for rendering of the canvas and its items only.
- Mobile optimisation.
- Implementation of working viruses.
- Display player name.
- Now supporting chat. 
- Type`-ping` in the chatbox to check your ping, as well as other commands!

---

## Installation

### Requirements
To run / install this game, you'll need: 
- NodeJS with NPM installed.

### Downloading the dependencies
After cloning the source code from Github, you need to run the following command to download all the dependencies (socket.IO, express, etc.):

```
npm install
```

### Running the Server
After downloading all the dependencies, you can build the client/frontend with the following command in a terminal:

```
npm run build
```

Then start the server with the following command:

```
npm dev:server
```

The server runs backend logic, and also serves the built client/frontend static site.

The game will then be accessible at `http://localhost:3000`. The default port is `3000`.

### Running the Client
If you want to have hot-reload for the client, run the following command in a terminal:

```
npm dev:client
```

The game will then be accessible at `http://localhost:5173`. The default port is `5173`.  This enables hot-reload during development for the client/frontend.

### Running the Server with Docker
If you have [Docker](https://www.docker.com/) installed, after cloning the repository you can run the following commands to start the server and make it acessible at `http://localhost:3000`:

```
docker build -t open_agario .
docker run -it -p 3000:3000 open_agario
```

---

## FAQ
1. **What is this game?**

  This is a clone of the game [Agar.IO](http://agar.io/). Someone said that Agar.IO is a clone of an iPad game called Osmos, but we haven't tried it yet. (Cloneception? :P)
  
2. **Why would you make this version of the game?**

  Well, while the original game is still online, it is closed-source, and sometimes, it suffers from massive lag. That's why we want to make an open source version of it: for educational purposes, and to let the community add the features that they want, self-host it on their own servers, have fun with friends and more.  The version by @owenashurst/agar.io-clone is too outdated, and uses webpack, babel, gulp, and Javascript for developemnt, all kinds of tools that's I don't like.  This one just uses Node, Vite and Typescript.  Done, clean and easy.
  
3. **Any plans on adding an online server to compete with Agar.IO or making money out of it?**

  No. This game belongs to the open-source community, and we have no plans on making money out of it nor competing with anything. But you can of course create your own public server, let us know if you do so and we can add it to our Live Demos list!
  
4. **Can I deploy this game to my own server?**

  Sure you can! That's what it's made for! ;)
  
5. **I don't like HTML5 canvas. Can I write my own game client with this server?**

  Of course! As long as your client supports WebSockets, you can write your game client in any language/technology, even with Unity3D if you want (there is an open source library for Unity to communicate with WebSockets)!
  
6. **Can I use some code of this project on my own?**

  Yes you can.

## For Developers
 - [Game Architecture](https://github.com/owenashurst/agar.io-clone/wiki/Game-Architecture) to understand how the backend works.

## License
This project is licensed under the terms of the **MIT** license.
