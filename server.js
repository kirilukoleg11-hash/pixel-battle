const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- НАСТРОЙКИ ИГРЫ ---
const GRID_SIZE = 100; // Размер поля
const COOLDOWN_MS = 5000; // Кулдаун для обычных игроков (5 секунд)
const ADMIN_PASSWORD = "oleg4432/"; // ТВОЙ ПАРОЛЬ

// Состояние игры
let canvasData = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'));
const cooldowns = {}; // Храним время последнего клика
const admins = new Set(); // Храним ID администраторов

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Подключился игрок:', socket.id);

    // Отправляем холст при входе
    socket.emit('loadCanvas', canvasData);

    // Логика входа в админку
    socket.on('becomeAdmin', (password) => {
        if (password === ADMIN_PASSWORD) {
            admins.add(socket.id);
            socket.emit('adminSuccess'); 
            console.log(`Игрок ${socket.id} стал админом!`);
        }
    });

    // Когда кто-то ставит пиксель
    socket.on('placePixel', (data) => {
        const { x, y, color } = data;
        const now = Date.now();
        const lastClick = cooldowns[socket.id] || 0;

        // ПРОВЕРКА КУЛДАУНА
        const isAdmin = admins.has(socket.id);
        
        // Если НЕ админ и времени прошло мало — сбрасываем
        if (!isAdmin && (now - lastClick < COOLDOWN_MS)) {
            console.log(`Попытка обхода КД от ${socket.id}`);
            return; 
        }

        // Если всё ок, рисуем
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            cooldowns[socket.id] = now; // Обновляем время только для не-админов (или для всех)
            canvasData[x][y] = color;
            io.emit('updatePixel', { x, y, color });
        }
    });

    socket.on('disconnect', () => {
        admins.delete(socket.id);
        delete cooldowns[socket.id];
        console.log('Игрок ушел:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});