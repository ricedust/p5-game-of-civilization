let fps = 24;
let cellSize = 30;

let cam;
let board;

let backgroundColor = 0;
let gridColor = 255;

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(fps);

  cam = createCamera();
  cam.setPosition(0, 0, 1000);

  stroke(gridColor);

  // get number of rows and columns from screen size and cellsize
  let columns = rows = floor(height / cellSize);
  board = new Board(columns, rows);
  board.randomize();
}

function draw() {
  background(backgroundColor);
  // CameraAnimation.tiltBack(1.1, 250, 0.1, 5);
  // CameraAnimation.spin(0.02);

  board.display();
  board.determineNextGeneration();
  board.updateToNextGeneration();

}

class Terrain {
  constructor(board) {
    this.board = board;
  }

}

class Board {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.grid = Array(columns * rows).fill().map(() => new Cell());
  }

  // assign random number of cells to be alive
  randomize() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        // cells on the edge of the board are ignored
        if (!this.#isCellOnEdge(x, y)) this.#getCell(x, y).isAlive = floor(random(2));
      }
    }
  }

  #getCell(x, y) { return this.grid[(y * this.columns) + x] }

  #isCellOnEdge(x, y) { return x == 0 || y == 0 || x == this.columns - 1 || y == this.rows - 1; }

  determineNextGeneration() {
    for (let x = 1; x < this.columns - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {

        let currentCell = this.#getCell(x, y);
        let neighborCount = this.#getNeighborCount(x, y);

        // Any live cell...
        if (currentCell.isAlive) {
          // 1. with fewer than two live neighbours dies, as if by underpopulation.
          if (neighborCount < 2) currentCell.willSurvive = false;
          // 2. with two or three live neighbours lives on to the next generation.
          else if (neighborCount == 2 || neighborCount == 3) currentCell.willSurvive = true;
          // 3. with more than three live neighbours dies, as if by overpopulation.
          else if (neighborCount > 3) currentCell.willSurvive = false;
        }
        // 4. Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
        else if (neighborCount == 3) currentCell.willSurvive = true;
      }
    }
  }

  updateToNextGeneration() { this.grid.forEach(cell => cell.applyFate()); }

  #getNeighborCount(x, y) {
    let neighborCount = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        neighborCount += this.#getCell(x + i, y + j).isAlive;
      }
    }
    // subtract state of self from neighbor count to avoid double counting
    return neighborCount - this.#getCell(x, y).isAlive;
  }

  display() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (!this.#isCellOnEdge(x, y)) this.#getCell(x, y).draw(x, y);
      }
    }
  }
}

class Cell {
  constructor() {
    this.isAlive = false;
    this.willSurvive = false;
  }

  applyFate() { this.isAlive = this.willSurvive }

  draw(x, y) {
    push();
    if (this.isAlive) fill(gridColor);
    else noFill();
    rect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    pop();
  }
}
