let cellSize = 20;

let cameraAnimator;
let board;
let terrainGenerator;

let simulationStartFrame = 0;
let secondsInSimulation = 0;
let simulationHasStarted = false;

let maxBuildingHeight = 15;

let backgroundColor = 0;
let gridColor = 255;

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  frameRate(10);

  setupBoard();

  cameraAnimator = new CameraAnimator(createCamera());
  ortho();

  stroke(gridColor);
}

function setupBoard() {
  let columns, rows;

  let shorterScreenDimension = width > height ? height : width;
  columns = rows = floor(shorterScreenDimension / cellSize);

  board = new Board(columns, rows);

  terrainGenerator = new TerrainGenerator(board, 10, 0.1, 10, 0.5);
  terrainGenerator.constructLevel(1);

  board.randomize();
}

function draw() {
  background(backgroundColor);
  
  if (simulationHasStarted) {
    secondsInSimulation = (frameCount - simulationStartFrame) / frameRate();

    cameraAnimator.tiltBack(0, 3, height / 2, height * 2, 0.03);
    cameraAnimator.orbit(0.005);

    if (secondsInSimulation < 10) {
      terrainGenerator.constructLevel(floor(secondsInSimulation));
    }
    else {
      board.determineNextGeneration();
      board.updateToNextGeneration(); 
    }
  }

  board.display();
}

function keyPressed() { 
  // drawing controls
  if (!simulationHasStarted) {
    if (keyCode == 32) { // Spacebar to start simulation
      perspective();
      simulationHasStarted = true;
      simulationStartFrame = frameCount;
    }
    else if (keyCode == 82) { // R to randomize
      board.randomize();
    }
    else if (keyCode == 67) {
      board.clear();
    }
  }
}

function mousePressed() { !simulationHasStarted && BoardInput.mousePressed(); }
function mouseDragged() { !simulationHasStarted && BoardInput.mouseDragged(); }
function mouseReleased() { !simulationHasStarted && BoardInput.mouseReleased(); }

class TerrainGenerator {
  constructor(board, maxHeight, noiseScale, octaves, octaveFalloffFactor) {
    this.board = board;
    this.height = maxHeight;
    this.noiseScale = noiseScale;
    this.octaves = octaves;
    this.octaveFalloffFactor = octaveFalloffFactor;
    
    noiseDetail(this.octaves, this.octaveFalloffFactor);
  }

  constructLevel(level) {
    for (let x = 0; x < this.board.columns; x++) {
      for (let y = 0; y < this.board.rows; y++) {

        if (!this.board.isCellOnEdge(x, y)) {
          let noiseValue = noise(x * this.noiseScale, y * this.noiseScale);
          let terrainHeight = 1 + floor(noiseValue * this.height);

          this.board.getCell(x, y).terrainBlocks = constrain(terrainHeight, 1, level);
        }
      }
    }
  }
}

class Cell {
  constructor() {
    this.isAlive = false;
    this.willSurvive = false;

    this.terrainBlocks = 0;
    this.buildingBlocks = 0;
  }

  applyFate() { 
    this.buildingBlocks += this.isAlive ? 1 : -1; 
    this.buildingBlocks = constrain(this.buildingBlocks, 0, maxBuildingHeight);
    this.isAlive = this.willSurvive;
  }
  
  draw(x, y) {
    push();
    if (this.isAlive) fill(gridColor);
    else fill(backgroundColor);

    translate(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
    this.drawTerrain();
    this.drawBuildings();

    pop();
  }

  drawTerrain() {
    if (simulationHasStarted) fill(backgroundColor);
    for(let z = 0; z < this.terrainBlocks; z++) {
      translate(0, 0, cellSize)
      box(cellSize);
    }
  }

  drawBuildings() {
    if (simulationHasStarted) {
      fill(gridColor);
      stroke(backgroundColor);
      for (let z = 0; z < this.buildingBlocks; z++) {
        translate(0, 0, cellSize);
        box(cellSize);
      }
    }
  }

}

class Board {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.grid = Array(columns * rows).fill().map(() => new Cell());
    this.pixelLength = this.columns * cellSize;
  }

  // assign random number of cells to be alive
  randomize() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        // cells on the edge of the board are ignored
        if (!this.isCellOnEdge(x, y)) this.getCell(x, y).isAlive = floor(random(2));
      }
    }
  }

  clear() { this.grid.forEach(cell => cell.isAlive = false) }

  getCell(x, y) { return this.grid[(y * this.columns) + x] }

  isCellOnEdge(x, y) { return x <= 0 || y <= 0 || x >= this.columns - 1 || y >= this.rows - 1; }

  determineNextGeneration() {
    for (let x = 1; x < this.columns - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {

        let currentCell = this.getCell(x, y);
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
        neighborCount += this.getCell(x + i, y + j).isAlive;
      }
    }
    // subtract state of self from neighbor count to avoid double counting
    return neighborCount - this.getCell(x, y).isAlive;
  }

  display() {
    push();
    translate(-this.pixelLength / 2 , -this.pixelLength / 2);
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        // display all cells except for the inactive ones on the edge
        if (!this.isCellOnEdge(x, y)) this.getCell(x, y).draw(x, y);
      }
    }
    pop();
  }
}

class BoardInput {
  static cellsEditedInCurrentStroke = new Set();
  static isErasing = false; // true for erasing, false for painting

  static mousePressed() {
    let cell = this.#getCellAtMouse();
    if (cell) {
      this.isErasing = cell.isAlive;
      cell.isAlive = !this.isErasing;
      this.cellsEditedInCurrentStroke.add(cell);
    }
  }

  static mouseDragged() {
    let cell = this.#getCellAtMouse();
    if (cell && !this.cellsEditedInCurrentStroke.has(cell)) {
      cell.isAlive = !this.isErasing;
      this.cellsEditedInCurrentStroke.add(cell);
    }
  }

  static mouseReleased() {
    this.cellsEditedInCurrentStroke.clear();
  }

  static #getCellAtMouse() {
    let mouseX2D = mouseX - width / 2;
    let mouseY2D = mouseY - height / 2;

    let centerOffset = board.pixelLength / 2;

    let cellX = floor((mouseX2D + centerOffset) / cellSize);
    let cellY = floor((mouseY2D + centerOffset) / cellSize);

    // return the cell if it's on the board, null otherwise
    return !board.isCellOnEdge(cellX, cellY) ? board.getCell(cellX, cellY) : null;
  }

}

class CameraAnimator {
  constructor(cam) {
    this.cam = cam;
    this.x = 0;
    this.y = 0;
    this.z = (height/2) / tan(PI/6); // default p5 value
    this.zRotation = 0;
  }

  tiltBack(startTimeSeconds, stopTimeSeconds, z, y, speed) {
    if (this.#insideTimeWindow(startTimeSeconds, stopTimeSeconds)) {
      this.z = lerp(this.z, z, speed);
      this.y = lerp(this.y, y, speed);
      this.cam.setPosition(this.x, this.y, this.z);
      this.cam.lookAt(0, 0, 0);
    }
  }

  orbit(speed) {
    this.zRotation += speed;
    rotateZ(this.zRotation);
  }

  #insideTimeWindow(startTimeSeconds, stopTimeSeconds) {
    return secondsInSimulation > startTimeSeconds && secondsInSimulation < stopTimeSeconds;
  }
}

