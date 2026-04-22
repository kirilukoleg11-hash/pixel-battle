const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GRID_SIZE = 100;

// 1. СРАЗУ СОЗДАЕМ ПУСТОЙ ХОЛСТ (чтобы сервер не падал от undefined)
let canvasData = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'));

// 2. ПОДКЛЮЧЕНИЕ К БАЗЕ (Замени ссылку на свою!)
const mongoURI = "mongodb+srv://kirilukoleg110_db_user:sqodPhppl2LMkbyx@cluster0.abcde.mongodb.net/pixel_db?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => {
        console.log("✅ Успех: База данных MongoDB подключена!");
        initCanvas(); // Загружаем данные только ПОСЛЕ подключения
    })
    .catch(err => console.error("❌ Ошибка подключения к базе:", err));

// Описываем схему данных
const CanvasModel = mongoose.model('Canvas', new mongoose.Schema({
    data: Array
}));

// Функция загрузки данных из облака
async function initCanvas() {
    try {
        const saved = await CanvasModel.findOne();
        if (saved && saved.data) {
            canvasData = saved.data;
            console.log("💾 Данные холста загружены из облака!");
        }
    } catch (err) {
        console.error("⚠️ Не удалось загрузить данные, используем пустой холст");
    }
}

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Отправляем текущее состояние поля новому игроку
    socket.emit('init', canvasData);

    // Когда игрок ставит пиксель
    socket.on('placePixel', async (data) => {
        const { x, y, color } = data;

        // Проверяем, что координаты в границах и массив существует
        if (canvasData[x] && canvasData[x][y] !== undefined) {
            canvasData[x][y] = color;
            
            // Рассылаем всем игрокам
            io.emit('updatePixel', { x, y, color });

            // Сохраняем в базу (без await, чтобы не тормозить игру)
            CanvasModel.findOneAndUpdate({}, { data: canvasData }, { upsert: true }).catch(e => {});
        }
    });
});

// ПОРТ ДЛЯ RENDER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});