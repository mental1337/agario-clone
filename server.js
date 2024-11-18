const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files
app.use(express.static('public'));

// Game state
const players = {};
const food = [];
const config = {
    foodCount: 50,
    mapSize: 4000,
    foodSize: 10
};

// Generate initial food
function generateFood() {
    while (food.length < config.foodCount) {
        food.push({
            x: Math.random() * config.mapSize,
            y: Math.random() * config.mapSize,
            color: `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`
        });
    }
}

generateFood();

io.on('connection', (socket) => {
    // New player connects
    players[socket.id] = {
        x: Math.random() * config.mapSize,
        y: Math.random() * config.mapSize,
        size: 20,
        color: `rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255})`,
        score: 0
    };

    // Send initial game state
    socket.emit('init', {
        playerId: socket.id,
        players,
        food,
        config
    });

    // Handle player movement
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnect', socket.id);
    });
});

// Game loop
setInterval(() => {
    io.emit('gameState', { players, food });
}, 1000/60);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});