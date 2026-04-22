const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 1. ПОДКЛЮЧЕНИЕ К БАЗЕ (Твоя ссылка)
const mongoURI = "mongodb+srv://kirilukoleg110_db_user:sqodPhppl2LMkbyx@cluster0...твоя_ссылка";
mongoose.connect(mongoURI).then(() => console.log("База подключена!"));

// Схема для хранения холста
const Canvas = mongoose.model('Canvas', new mongoose.Schema({ data: Array }));

const GRID_SIZE = 100;
let canvasData = [];

// Загружаем данные из базы при старте
async function initCanvas() {
    const saved = await Canvas.findOne();
    if (saved) {
        canvasData = saved.data;
    } else {
        canvasData = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'));
    }
}
initCanvas();

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Отправляем текущий холст новому игроку
    socket.emit('init', canvasData);

    // Когда кто-то кликнул
    socket.on('placePixel', async ({ x, y, color }) => {
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            canvasData[x][y] = color;
            io.emit('updatePixel', { x, y, color }); // Всем игрокам
            
            // Сохраняем в базу (асинхронно)
            await Canvas.findOneAndUpdate({}, { data: canvasData }, { upsert: true });
        }
    });
});

// ПОРТ ДЛЯ RENDER (Обязательно так!)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер летит на порту ${PORT}`));