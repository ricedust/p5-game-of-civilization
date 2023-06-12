# Game of Civilization

![image](https://github.com/ricedust/p5-game-of-civilization/assets/62413269/d45066c0-9624-486e-87dd-b3b1242b6821)

Conway's Game of Life but cells grow and shrink vertically over time on procedurally generated terrain.

## How To Run

### [Click here to play the simulation in the browser](ricedust.com/p5-game-of-civilization)

Drag or click with the mouse to paint or erase cells. This will be the starting pattern for the game. When you are ready, press spacebar to start the game. Press spacebar again to end the game and return to edit mode.

| Hotkey | Function |
| --- | --- |
| Spacebar | Enter/exit simulation |
| C | Clear the board in edit mode |
| R | Randomize the board in edit mode |

## How It Works

The simulation follows Conway's [original rules](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) for the Game of Life.

Every tick, I check the state of each cell. If the cell is alive, it builds up one block, as if by expansion. If the cell is dead, it collapses one block, as if by deterioration. This essentially creates a heatmap of how long a cell has been alive in the form of a building. Over time, that looks something like this:

https://github.com/ricedust/p5-game-of-civilization/assets/62413269/c3c8b813-a7ed-40fb-81e9-0fa3d83ab981

I also experimented with a different kind of deterioration: rather than collapsing a building block, I convert the lowest building block into a terrain block so that old building blocks become part of the landscape. Over time, new civilizations pile on top of older ones, creating something that looks like a city:

https://github.com/ricedust/p5-game-of-civilization/assets/62413269/0f386596-ffe7-4901-a5a5-dbe1c2dda8cb

I did not include that version in the playable version below because it is not so performace friendly, but the result is interesting nevertheless.

For the terrain I use 2D Perlin noise to procedurally generate the Minecraft-like terrain. I think it adds interesting height variations to the buildings, as if the cells live and build on top of actual geography.

## Credit

I borrowed the logic to elegantly count a cell's neighbors from this [p5.js example](https://p5js.org/examples/simulate-game-of-life.html) by Daniel Shiffman.
