// Get terminal size dynamically
const process = require('process');
let width = process.stdout.columns;
let height = process.stdout.rows - 1; // Leave 1 row for the cursor reset

// Event listener for terminal resize
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

process.stdout.on('resize', debounce(() => {
    width = process.stdout.columns;
    height = process.stdout.rows - 1;
}));

let bubbles = [];

// Initialize fish positions and directions for multiple fish
let fish = [
    { x: 0, y: 0, direction: 'right' },
    { x: 15, y: 0, direction: 'right' },
    { x: 30, y: 0, direction: 'right' },
    { x: 45, y: 0, direction: 'right' },
    { x: 60, y: 0, direction: 'right' },
    { x: width - 1, y: 0, direction: 'left' } // Adjusted for correct initial position
];

// Dynamically calculate fish Y-positions based on terminal height
let fishYPositions = [];

// Define different fish types and their mirrored versions
const fishTypes = [
    { normal: '><(((o', mirrored: 'o)))><', color: '\x1b[34m' }, // Classic Fish, Blue
    { normal: '><>', mirrored: '<><', color: '\x1b[32m' },       // Small Fish, Green
    { normal: '><(((º>', mirrored: 'º)))><', color: '\x1b[31m' }, // Big Fish, Red
    { normal: '><====>', mirrored: '<====><', color: '\x1b[35m' }, // Shark, Magenta
    { normal: '><(((°>', mirrored: '°)))><', color: '\x1b[36m' }   // Fancy Fish, Cyan
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
    height = process.stdout.rows - 1; // Update height in case of terminal resize
    width = process.stdout.columns; // Update width in case of terminal resize
    fishYPositions = [
        Math.floor(height * 0.2), // Position for Classic Fish
        Math.floor(height * 0.4), // Position for Small Fish
        Math.floor(height * 0.6), // Position for Big Fish
        Math.floor(height * 0.8), // Position for Shark
        Math.floor(height * 0.3), // Position for Fancy Fish
    ];
}

// Function to clear previous fish positions
function clearPreviousFish(aquarium, x, y, fishType, direction) {
    const fishLength = direction === 'right' ? fishType.normal.length : fishType.mirrored.length;
    for (let i = 0; i < fishLength; i++) {
        if (x + i >= 0 && x + i < width && y >= 0 && y < height) {
            aquarium[y][x + i] = ' '; // Clear the previous fish position
        }
    }
}

// Function to add fish to the aquarium with colors
function addFish(aquarium, x, y, fishType, color, direction) {
    let fishString = (direction === 'right' ? fishType.normal : fishType.mirrored);
    // Apply color
    fishString = color + fishString + '\x1b[0m'; // Reset color after fish
    for (let i = 0; i < fishString.length; i++) {
        if (x + i >= 0 && x + i < width) {
            aquarium[y][x + i] = fishString[i]; // Place each character of the fish
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
        bubbles.push({ x: Math.floor(Math.random() * width), y: height - 2 });
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
    process.stdout.write('\x1B[0;0H');
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
    fish.forEach(f => {
        clearPreviousFish(aquarium, f.x, fishYPositions[0], fishTypes[0], f.direction);
    });

    // Add fish with different styles and colors at dynamically calculated Y-positions
    fish.forEach((f, index) => {
        addFish(aquarium, f.x, fishYPositions[index % fishYPositions.length], fishTypes[index % fishTypes.length], fishTypes[index % fishTypes.length].color, f.direction);
    });

    displayAquarium(aquarium);

  // Move fish at different speeds and change direction if needed
fish.forEach(f => {
    const fishType = fishTypes[fish.indexOf(f) % fishTypes.length];
    const fishLength = f.direction === 'right' ? fishType.normal.length : fishType.mirrored.length;
    if (f.direction === 'right') {
        f.x += 1;
        if (f.x >= width - fishLength) { // Correctly adjust based on fish type length
            f.direction = 'left';
            f.x = width - fishLength - 1; // Ensure fish turns around before hitting the edge
        }
    } else {
        f.x -= 1;
        if (f.x < 0) {
            f.direction = 'right';
            f.x = 0; // Reset to left edge
        }
    }
});
}

// Function to randomize fish positions to avoid overlap
function randomizeFishPositions() {
    const maxFishLength = Math.max(...fishTypes.map(f => f.normal.length)); // Find the longest fish
    const availablePositions = [];
    // Generate available positions considering fish length to avoid overlap
    for (let y = 1; y < height - 1; y++) { // Avoid top and bottom borders
        for (let x = 1; x < width - maxFishLength; x++) { // Avoid side borders and ensure fish fit
            availablePositions.push({ x, y });
        }
    }

    // Shuffle available positions to randomize
    for (let i = availablePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }

    // Assign positions to fish from the shuffled available positions
    fish.forEach((f, index) => {
        if (index < availablePositions.length) {
            const pos = availablePositions[index];
            f.x = pos.x;
            f.y = pos.y;
        } else {
            // If more fish than positions, place remaining fish outside the visible area
            f.x = -1;
            f.y = -1;
        }
    });
}

// Set up an interval to continuously update and display the aquarium
setInterval(mainLoop, 20); // Reduced the interval to make animation smoother