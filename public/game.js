const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const socket = io();
let playerId;
let players = {};
let food = [];
let config;
let camera = { x: 0, y: 0 };

// Add debug logging
socket.on('connect', () => {
    console.log('Connected to server');
});

// Handle initial game state
socket.on('init', (data) => {
    console.log('Received init data:', data); // Debug log
    playerId = data.playerId;
    players = data.players;
    food = data.food;
    config = data.config;
});

// Handle game state updates
socket.on('gameState', (data) => {
    players = data.players;
    food = data.food;
});

socket.on('playerDisconnect', (id) => {
    delete players[id];
});

// Mouse movement
let mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

// Modified game loop with debug visuals
function gameLoop() {
    // Clear canvas with a light gray background to make it visible
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a reference point at center of screen
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();

    if (!players[playerId]) {
        console.log('Waiting for player initialization...'); // Debug log
        requestAnimationFrame(gameLoop);
        return;
    }

    const player = players[playerId];
    console.log('Player position:', player.x, player.y); // Debug log

    // Update player position based on mouse
    const dx = (mouse.x - canvas.width/2);
    const dy = (mouse.y - canvas.height/2);
    const distance = Math.sqrt(dx*dx + dy*dy);
    const speed = 5;

    if (distance > 0) {
        player.x += (dx/distance) * speed;
        player.y += (dy/distance) * speed;
        socket.emit('move', { x: player.x, y: player.y });
    }

    // Update camera position
    camera.x = player.x - canvas.width/2;
    camera.y = player.y - canvas.height/2;

    // Draw food
    food.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x - camera.x, f.y - camera.y, config.foodSize, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
    });

    // Draw players
    Object.values(players).forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color || 'blue'; // Default color if none set
        ctx.fill();
        
        // Draw player name/score
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.font = '14px Arial'; // Add font specification
        ctx.fillText(`Score: ${p.score}`, p.x - camera.x, p.y - camera.y);
    });

    requestAnimationFrame(gameLoop);
}
// Start game loop
gameLoop();

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
