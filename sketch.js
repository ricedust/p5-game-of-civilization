let cellSize = 30;

let cameraAnimator;
let board;
let terrainGenerator;

let tickIntervalSeconds = 0.5;
let maxTerrainHeight = 10;
let maxBuildingHeight = 15;
let blockAnimationSpeed = 0.3;

let backgroundColor = 0;
let gridColor = 255;

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  stroke(gridColor);

  setupBoard(); // initialize board
  Clock.tickIntervalSeconds = tickIntervalSeconds; // time interval between each board update

  cameraAnimator = new CameraAnimator(createCamera()); // create camera object
}

function setupBoard() {
  let columns, rows;
  let shorterScreenDimension = width > height ? height : width;
  columns = rows = floor(shorterScreenDimension / cellSize);

  board = new Board(columns, rows);

  terrainGenerator = new TerrainGenerator(board, maxTerrainHeight, 0.1, 6, 0.2);
  terrainGenerator.constructLevel(1);

  board.randomize();
}

function draw() {
  background(backgroundColor);

  if (Clock.isTicking) {
    cameraAnimator.tiltBack(height * 0.7, height * 1.5, 0.03);
    cameraAnimator.orbit(0.005);

    // fire once every tick
    if (Clock.tickCount > Clock.currentTick) {

      if (Clock.seconds < 5) {
        terrainGenerator.constructLevel(Clock.currentTick + 1);
      }
      else {
        board.determineNextGeneration();
        board.updateToNextGeneration();
      }
      Clock.currentTick++;
    }
    
    Clock.update();
  } 
  else cameraAnimator.reset(0.05);

  board.draw();
}

function keyPressed() { 
  if (!Clock.isTicking) { // Edit mode controls
    if (keyCode == 32) {  Clock.startTicking(); } // Spacebar to start simulation
    else if (keyCode == 82) { board.randomize(); } // R to randomize board in edit mode
    else if (keyCode == 67) { board.clear(); } // C to clear board in edit mode
  }
  else {
    if (keyCode == 32) { Clock.reset(); setupBoard(); } // Spacebar to stop simulation
  }
}

function mousePressed() { !Clock.isTicking && BoardInput.mousePressed(); }
function mouseDragged() { !Clock.isTicking && BoardInput.mouseDragged(); }
function mouseReleased() { !Clock.isTicking && BoardInput.mouseReleased(); }

class TerrainGenerator {
  constructor(board, maxHeight, noiseScale, octaves, octaveFalloffFactor) {
    this.board = board;
    this.maxHeight = maxHeight;
    this.noiseScale = noiseScale;
    this.octaves = octaves;
    this.octaveFalloffFactor = octaveFalloffFactor;
    
    noiseDetail(this.octaves, this.octaveFalloffFactor);
    noiseSeed(millis());
  }

  constructLevel(level) {
    for (let x = 1; x < this.board.columns - 1; x++) {
      for (let y = 1; y < this.board.rows - 1; y++) {
        
        let blockColumn = this.board.getCell(x, y).blockColumn;
        let noiseValue = noise(x * this.noiseScale, y * this.noiseScale);
        let terrainHeight = floor(noiseValue * this.maxHeight);

        blockColumn.setTerrainHeight(constrain(terrainHeight, 1, level));
      }
    }
  }
}

class Cell {
  constructor(x, y, isOnEdge) {
    this.x = x;
    this.y = y;
    this.isOnEdge = isOnEdge;

    this.isAlive = false;
    this.willSurvive = false;

    this.blockColumn = new BlockColumn(isOnEdge);
  }

  update() { 
    this.isAlive ? this.blockColumn.rise() : this.blockColumn.fall();
    this.isAlive = this.willSurvive;
  }
  
  draw() {
    push();

    fill(this.isAlive ? gridColor : backgroundColor);
    translate(this.x * cellSize, this.y * cellSize);

    this.blockColumn.draw();

    pop();
  }
}

class BlockColumn {
  constructor(isOnEdge) {
    this.terrainHeight = 0;
    this.buildingHeight = 0;
    // animation variables
    this.terrainZ = 0; // local z position of the top terrain block
    this.buildingZ = 0; // local z position of the top building block
    this.isFalling = false;

    this.isOnEdge = isOnEdge;
  }

  rise() { 
    this.isFalling = false;
    if (this.buildingHeight < maxBuildingHeight) {
      this.buildingHeight++; 
      this.buildingZ = 0;
    }
  }

  fall() { 
    if (this.buildingHeight > 0) {
      if (this.isFalling) this.buildingHeight--;
      else this.isFalling = true;
      this.buildingZ = cellSize;
      // this.buildingHeight--; 
      // this.terrainHeight++;
    }
  }
  
  setTerrainHeight(terrainHeight) {
    if (this.terrainHeight != terrainHeight) {
      this.terrainHeight = terrainHeight;
      this.terrainZ = 0; // reset animation
    }
  }

  draw() {
    if (this.terrainHeight) this.#drawTerrain();
    if (this.buildingHeight) this.#drawBuilding();
  }

  #drawTerrain() {
    if (Clock.isTicking) fill(backgroundColor);

    for(let z = 0; z < this.terrainHeight - 1; z++) {
      translate(0, 0, cellSize);
      if (this.isOnEdge) box(cellSize);
    }

    // animate top terrain block
    this.terrainZ = lerp(this.terrainZ, cellSize, blockAnimationSpeed);
    translate(0, 0, this.terrainZ);
    box(cellSize);
  }

  #drawBuilding() {
    fill(gridColor);
    stroke(backgroundColor);

    for(let z = 0; z < this.buildingHeight - 1; z++) {
      translate(0, 0, cellSize);
      box(cellSize);
    }

    // animate top building block
    let targetZ = this.isFalling ? 0 : cellSize;
    this.buildingZ = lerp(this.buildingZ, targetZ, blockAnimationSpeed);
    translate(0, 0, this.buildingZ);
    box(cellSize);
  }
  
}

class Board {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.lengthPixels = this.columns * cellSize;

    this.grid = Array(columns * rows);
    this.#populateGrid();
  }

  #populateGrid() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        let isCellOnEdge = x == 1 || y == 1 || x == this.columns - 2 || y == this.rows - 2;
        this.grid[(y * this.columns) + x] = new Cell(x, y, isCellOnEdge);
      }
    }
  }

  // assign random number of cells to be alive, 
  // cells on the edge of the board are ignored
  randomize() {
    for (let x = 1; x < this.columns - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {
        this.getCell(x, y).isAlive = floor(random(2));
      }
    }
  }

  clear() { this.grid.forEach(cell => cell.isAlive = false) }

  getCell(x, y) { return this.grid[(y * this.columns) + x] }

  // returns true if the cell is on the board and not an edge cell
  isCellValid(x, y) { return !(x <= 0 || y <= 0 || x >= this.columns - 1 || y >= this.rows - 1); }

  determineNextGeneration() {
    for (let x = 1; x < this.columns - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {

        let currentCell = this.getCell(x, y);
        let neighborCount = this.#getNeighborCount(currentCell);

        // Any live cell with two or three live neighbours survives.
        if (currentCell.isAlive) {
          if (neighborCount == 2 || neighborCount == 3) currentCell.willSurvive = true;
          // All other live cells die in the next generation. Similarly, all other dead cells stay dead.
          else currentCell.willSurvive = false;
        }
        // Any dead cell with three live neighbours becomes a live cell.
        else if (neighborCount == 3) currentCell.willSurvive = true;
      }
    }
  }

  updateToNextGeneration() { this.grid.forEach(cell => cell.update()); }

  #getNeighborCount(cell) {
    let neighborCount = 0;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        neighborCount += this.getCell(cell.x + i, cell.y + j).isAlive;
      }
    }
    // subtract state of self from neighbor count to avoid double counting
    return neighborCount - cell.isAlive;
  }

  draw() {
    push();

    let cellCenterOffset = cellSize / 2;
    let halfBoardLength = this.lengthPixels / 2;
    // centers the board 
    translate(-halfBoardLength + cellCenterOffset, -halfBoardLength + cellCenterOffset, -cellSize);
    
    for (let x = 1; x < this.columns - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {
        this.getCell(x, y).draw();
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

    let centerOffset = board.lengthPixels / 2;

    let cellX = floor((mouseX2D + centerOffset) / cellSize);
    let cellY = floor((mouseY2D + centerOffset) / cellSize);

    // return the cell if it's on the board, null otherwise
    return board.isCellValid(cellX, cellY) ? board.getCell(cellX, cellY) : null;
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

  tiltBack(z, y, speed) {
    this.z = lerp(this.z, z, speed);
    this.y = lerp(this.y, y, speed);
    this.cam.setPosition(this.x, this.y, this.z);
    this.cam.lookAt(0, 0, 0);
  }

  orbit(speed) {
    this.zRotation = (this.zRotation + speed) % TWO_PI;
    rotateZ(this.zRotation);
  }

  reset(speed) {
    this.z = lerp(this.z, (height/2) / tan(PI/6), speed);
    this.y = lerp(this.y, 0, speed);
    this.zRotation = lerp(this.zRotation, 0, speed);
    
    this.cam.setPosition(this.x, this.y, this.z);
    this.cam.lookAt(0, 0, 0);
    rotateZ(this.zRotation);
  }
}

class Clock {
  static tickIntervalSeconds = 1;
  static tickerID;
  
  static seconds = 0;
  static currentTick = 0;
  static tickCount = 0;
  static isTicking = false;

  static startTicking() {
    this.tickerID = setInterval(() => { this.tickCount++ }, this.tickIntervalSeconds * 1000);
    this.isTicking = true;
  }

  static reset() { 
    clearInterval(this.tickerID);

    this.seconds = 0;
    this.currentTick = 0;
    this.tickCount = 0;
    this.isTicking = false; 
  }

  static update() { this.seconds += deltaTime / 1000;}
}

