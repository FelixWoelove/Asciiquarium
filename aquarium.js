// Get terminal size dynamically
const { stdout } = require('process');
let width = stdout.columns;
let height = stdout.rows - 1; // Leave 1 row for the cursor reset

// Event listener for terminal resize
stdout.on('resize', () => {
    width = stdout.columns;
    height = stdout.rows - 1;
});

let bubbles = [];

// Initialize fish positions for multiple fish
let fishX1 = 0;
let fishX2 = 15;
let fishX3 = 30;
let fishX4 = 45;
let fishX5 = 60;

let prevFishX1, prevFishX2, prevFishX3, prevFishX4, prevFishX5; // Previous positions to clear fish

// Dynamically calculate fish Y-positions based on terminal height
let fishYPositions = [];

// Define different fish types
const fishTypes = [
    '><(((',    // Classic Fish
    '><>',      // Small Fish
    '><(((º>',  // Big Fish
    '><====>',  // Shark
    '><(((°>',  // Fancy Fish
];

// Function to create the aquarium matrix
function createAquarium() {
    let aquarium = [];
    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1) {
                row.push('-'); // Top and bottom borders
            } else if (x === 0 || x === width - 1) {
                row.push('|'); // Side borders
            } else {
                row.push(' '); // Water
            }
        }
        aquarium.push(row);
    }
    return aquarium;
}

// Function to dynamically update fish Y-positions
function updateFishYPositions() {
    height = stdout.rows - 1; // Update height in case of terminal resize
    width = stdout.columns; // Update width in case of terminal resize
    fishYPositions = [
        Math.floor(height * 0.2), // Position for Classic Fish
        Math.floor(height * 0.4), // Position for Small Fish
        Math.floor(height * 0.6), // Position for Big Fish
        Math.floor(height * 0.8), // Position for Shark
        Math.floor(height * 0.3), // Position for Fancy Fish
    ];
}

// Function to clear previous fish positions
function clearPreviousFish(aquarium, x, y, fishType) {
    for (let i = 0; i < fishType.length; i++) {
        if (x + i >= 0 && x + i < width && y >= 0 && y < height) {
            aquarium[y][x + i] = ' '; // Clear the previous fish position
        }
    }
}

// Function to add fish to the aquarium with colors
function addFish(aquarium, x, y, fishType, color) {
    const resetColor = '\x1b[0m';
    const fishArray = Array.from(fishType); // Properly handle multi-byte characters
    const coloredFishArray = fishArray.map(char => `${color}${char}${resetColor}`);

    for (let i = 0; i < fishArray.length; i++) {
        if (x + i >= 0 && x + i < width && y >= 0 && y < height) {
            aquarium[y][x + i] = coloredFishArray[i];
        }
    }
}

// Function to update bubble positions
function updateBubbles(aquarium) {
    for (let i = 0; i < bubbles.length; i++) {
        aquarium[bubbles[i].y][bubbles[i].x] = ' '; // Clear the old bubble position
        bubbles[i].y -= 1; // Move the bubble up
        if (bubbles[i].y < 0) { // Remove the bubble if it reaches the top
            bubbles.splice(i, 1);
            i--; // Adjust the index after removal
        }
    }
}

// Function to add bubbles to the aquarium at random positions
function addBubbles() {
    if (Math.random() < 0.5) { // Adjust probability to control bubble generation rate
        bubbles.push({ x: Math.floor(Math.random() * width), y: height - 1 });
    }
}

// Function to draw bubbles in the aquarium
function drawBubbles(aquarium) {
    bubbles.forEach(bubble => {
        if (bubble.y >= 0 && bubble.y < height && bubble.x >= 0 && bubble.x < width) {
            aquarium[bubble.y][bubble.x] = 'o';
        }
    });
}

// Function to display the aquarium
function displayAquarium(aquarium) {
    // Move the cursor to the top-left corner of the terminal
    stdout.write('\x1B[0;0H');
    aquarium.forEach(row => {
        console.log(row.join(''));
    });
}

// Main loop to refresh the aquarium
function mainLoop() {
    updateFishYPositions(); // Update fish Y-positions dynamically
    let aquarium = createAquarium();

    addBubbles(); // Add new bubbles
    updateBubbles(aquarium); // Update existing bubbles
    drawBubbles(aquarium); // Draw bubbles in the aquarium
    
    // Clear previous fish positions to prevent blinking
    clearPreviousFish(aquarium, prevFishX1, fishYPositions[0], fishTypes[0]);
    clearPreviousFish(aquarium, prevFishX2, fishYPositions[1], fishTypes[1]);
    clearPreviousFish(aquarium, prevFishX3, fishYPositions[2], fishTypes[2]);
    clearPreviousFish(aquarium, prevFishX4, fishYPositions[3], fishTypes[3]);
    clearPreviousFish(aquarium, prevFishX5, fishYPositions[4], fishTypes[4]);

    // Add fish with different styles and colors at dynamically calculated Y-positions
    addFish(aquarium, fishX1, fishYPositions[0], fishTypes[0], '\x1b[34m');  // Blue Classic Fish
    addFish(aquarium, fishX2, fishYPositions[1], fishTypes[1], '\x1b[31m');  // Red Small Fish
    addFish(aquarium, fishX3, fishYPositions[2], fishTypes[2], '\x1b[33m');  // Yellow Big Fish
    addFish(aquarium, fishX4, fishYPositions[3], fishTypes[3], '\x1b[32m');  // Green Shark
    addFish(aquarium, fishX5, fishYPositions[4], fishTypes[4], '\x1b[36m');  // Cyan Fancy Fish
    
    displayAquarium(aquarium);

    // Move fish at different speeds
    fishX1 += 1;  // Classic Fish
    fishX2 += 2;  // Small Fish moves faster
    fishX3 += 1;  // Big Fish
    fishX4 += 0.5;  // Shark moves slower
    fishX5 += 1.5;  // Fancy Fish

    // Reset fish positions when they reach the end
    if (fishX1 > width - fishTypes[0].length) fishX1 = 0;
    if (fishX2 > width - fishTypes[1].length) fishX2 = 0;
    if (fishX3 > width - fishTypes[2].length) fishX3 = 0;
    if (fishX4 > width - fishTypes[3].length) fishX4 = 0;
    if (fishX5 > width - fishTypes[4].length) fishX5 = 0;

    // Store previous positions to clear them in the next frame
    prevFishX1 = fishX1;
    prevFishX2 = fishX2;
    prevFishX3 = fishX3;
    prevFishX4 = fishX4;
    prevFishX5 = fishX5;
}

let buffer1 = createAquarium();
let buffer2 = createAquarium();
let currentBuffer = buffer1;
let displayBuffer = buffer2;

function swapBuffers() {
    let temp = displayBuffer;
    displayBuffer = currentBuffer;
    currentBuffer = temp;
}

setInterval(mainLoop, 100); // Call mainLoop() every 100 milliseconds
