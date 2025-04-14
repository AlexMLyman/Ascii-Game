// Constants
const TILE_SIZE = 16; // Size of each character
const GRID_WIDTH = 40; // Number of characters horizontally
const GRID_HEIGHT = 25; // Number of characters vertically

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GRID_WIDTH * TILE_SIZE;
canvas.height = GRID_HEIGHT * TILE_SIZE;

// Game state
const world = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
const colors = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill('#FFF'));
const background = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill('#0F0'));

// Fill world with walls
for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
        if (x === 0 || y === 0 || x === GRID_WIDTH - 1 || y === GRID_HEIGHT - 1) {
            world[y][x] = ' '; // Wall character
            background[y][x] = '#888'; // Gray color for walls
        }
    }
}

// Create a castle
world[10][30] = ' ';
background[10][30] = '#808080';

// Create a lake
world[10][10] = ' ';
background[10][10] = '#0ff';
world[11][10] = ' ';
background[11][10] = '#0ff';
world[10][11] = ' ';
background[10][11] = '#0ff';
world[9][10] = ' ';
background[9][10] = '#0ff';
world[10][9] = ' ';
background[10][9] = '#0ff';

// Player state
const player = {
    x: 1,
    y: 1,
    char: '\u263B',
    color: '#FFFF00' // Yellow color
};

// Render function
function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set font properties
    ctx.font = `${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center'; // Center text horizontally
    ctx.textBaseline = 'middle'; // Center text vertically

    // Draw world
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const char = world[y][x];
            ctx.fillStyle = background[y][x];
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            if (char !== 0) { // 0 represents empty space
                ctx.fillStyle = colors[y][x];
                ctx.fillText(char, (x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE);
            }
        }
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillText(player.char, (player.x + 0.5) * TILE_SIZE, (player.y + 0.5) * TILE_SIZE);
}

// Function to check if a position is walkable
function isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return false;
    return world[y][x] === 0; // Walkable if the cell is empty (value is 0)
}

// Game loop constants
const UPDATE_RATE = 30; // Updates per second (game engine update rate)
const RENDER_RATE = 30; // Frames per second (render frame rate)
const UPDATE_INTERVAL = 1000 / UPDATE_RATE;
const RENDER_INTERVAL = 1000 / RENDER_RATE;

let lastUpdateTime = performance.now();
let lastRenderTime = performance.now();
let accumulatedTime = 0;// Movement interval
const MOVE_INTERVAL = 150; // Move every 150ms
let lastMoveTime = 0;
let queuedMove = false; // Tracks if a movement is queued for instant response

// Track pressed keys
const keysHeld = new Set();
let lastPressedKey = null;

// Input handling
document.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        if (!keysHeld.has(event.key)) {
            keysHeld.add(event.key);
            lastPressedKey = event.key;

            // Only queue an instant move if this is the **first key pressed**
            if (keysHeld.size === 1) {
                queuedMove = true;
            }
        }
    }
});

document.addEventListener('keyup', (event) => {
    keysHeld.delete(event.key);
    if (event.key === lastPressedKey) {
        lastPressedKey = keysHeld.size > 0 ? Array.from(keysHeld).pop() : null;
    }
});

// Determine movement direction
function getMovementDirection() {
    let dx = 0, dy = 0;

    if (keysHeld.has('ArrowUp') && !keysHeld.has('ArrowDown')) dy = -1;
    if (keysHeld.has('ArrowDown') && !keysHeld.has('ArrowUp')) dy = 1;
    if (keysHeld.has('ArrowLeft') && !keysHeld.has('ArrowRight')) dx = -1;
    if (keysHeld.has('ArrowRight') && !keysHeld.has('ArrowLeft')) dx = 1;

    if (keysHeld.has('ArrowLeft') && keysHeld.has('ArrowRight')) {
        dx = lastPressedKey === 'ArrowRight' ? 1 : -1;
    }
    if (keysHeld.has('ArrowUp') && keysHeld.has('ArrowDown')) {
        dy = lastPressedKey === 'ArrowDown' ? 1 : -1;
    }

    return { dx, dy };
}

// Move player
function processMovement() {
    const { dx, dy } = getMovementDirection();
    if (dx !== 0 || dy !== 0) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        if (isWalkable(newX, newY)) {
            player.x = newX;
            player.y = newY;
        }
    }
}

// Update loop
function update(currentTime) {
    if (queuedMove) { // If a move was queued, execute immediately
        processMovement();
        lastMoveTime = currentTime;
        queuedMove = false; // Reset queued move
    } else if (currentTime - lastMoveTime >= MOVE_INTERVAL) { // Normal movement interval
        lastMoveTime = currentTime;
        processMovement();
    }
}


function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    // Calculate time since last update and render
    const deltaUpdateTime = currentTime - lastUpdateTime;
    const deltaRenderTime = currentTime - lastRenderTime;

    // Run updates at the fixed update rate
    if (deltaUpdateTime >= UPDATE_INTERVAL) {
        accumulatedTime += deltaUpdateTime;

        while (accumulatedTime >= UPDATE_INTERVAL) {
            update(currentTime); // Call the game logic update function
            accumulatedTime -= UPDATE_INTERVAL;
        }

        lastUpdateTime = currentTime;
    }

    // Run rendering at the fixed render rate
    if (deltaRenderTime >= RENDER_INTERVAL) {
        render(); // Call the rendering function
        lastRenderTime = currentTime;
    }
}

// Start the game loop
requestAnimationFrame(gameLoop);
gameLoop(performance.now());
