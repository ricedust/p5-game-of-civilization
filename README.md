# Game of Civilization

![image](https://github.com/ricedust/p5-game-of-civilization/assets/62413269/42c7c8a5-0af6-42dd-95ec-1b44a94c08a2)

Conway's Game of Life but cells grow and shrink vertically over time on procedurally generated terrain.

## How To Run

Drag or click with the mouse to paint or erase cells. This will be the starting pattern for the game. When you are ready, press spacebar to start the game. Press spacebar again to end the game and return to edit mode.

| Hotkey | Function |
| --- | --- |
| Spacebar | Enter/exit simulation |
| C | Clear the board in edit mode |
| R | Randomize the board in edit mode |

### [Click here to play the simulation in the browser.](http://ricedust.com/p5-game-of-civilization/)

## How It Works

The simulation follows Conway's [original rules](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) for the Game of Life.

Every tick, I check the state of each cell. If the cell is alive, it builds up one block, as if by expansion. If the cell is dead, it collapses one block, as if by deterioration. This essentially creates a heatmap of how long a cell has been alive in the form of a building.

For the terrain I use 2D Perlin noise to procedurally generate the Minecraft-like terrain. I think it adds interesting height variations to the buildings, as if the cells live and build on top of actual geography.

## Credit

I borrowed the logic to elegantly count a cell's neighbors from this [p5.js example](https://p5js.org/examples/simulate-game-of-life.html) by Daniel Shiffman.
