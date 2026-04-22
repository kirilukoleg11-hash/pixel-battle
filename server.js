const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Библиотека для работы с базой данных

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GRID_SIZE = 100;

// Твоя ссылка, которую ты получил в MongoDB
const mongoURI = "mongodb+srv://kirilukoleg110_db_user:oleg4432@cluster0.4b7jsbj.mongodb.net/pixel_battle?retryWrites=true&w=majority&appName=Cluster0";

// Подключаемся к облаку
mongoose.connect(mongoURI)
    .then(() => console.log("Ура! База данных подключена!"))
    .catch(err => console.error("Ошибка подключения к базе:", err));

// Создаем схему (как данные будут лежать в базе)
const CanvasSchema = new mongoose.Schema({
    pixels: Array
});
const Canvas = mongoose.model('Canvas', CanvasSchema);

let canvasData = [];

// Функция инициализации холста
async function initCanvas() {
    try {
        let savedCanvas = await Canvas.findOne();
        if (savedCanvas) {
            canvasData = savedCanvas.pixels;
            console.log("Холст загружен из базы данных.");
        } else {
            // Если в базе еще ничего нет, создаем белое поле
            canvasData = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'));
            await new Canvas({ pixels: canvasData }).save();
            console.log("Создан новый чистый холст в базе.");
        }
    } catch (err) {
        console.error("Ошибка при работе с холстом:", err);
    }
}

initCanvas();

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Отправляем текущее состояние холста новому игроку
    socket.emit('init', canvasData);

    socket.on('placePixel', async (data) => {
        const { x, y, color } = data;
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            canvasData[x][y] = color;
            io.emit('updatePixel', { x, y, color });
            
            // Сохраняем изменение в облако
            await Canvas.findOneAndUpdate({}, { pixels: canvasData });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});