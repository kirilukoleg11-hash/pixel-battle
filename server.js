const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GRID_SIZE = 100;

// 1. Инициализация холста в памяти сервера
let canvasData = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'));

// 2. Ссылка на твою базу (проверь пароль oleg4432)
const mongoURI = "mongodb+srv://kirilukoleg110_db_user:oleg4432@cluster0.4b7jsbj.mongodb.net/pixel_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => {
        console.log("✅ ПОБЕДА: База данных подключена успешно!");
        initCanvas();
    })
    .catch(err => console.error("❌ ОШИБКА БАЗЫ:", err.message));

// Схема данных
const CanvasModel = mongoose.model('Canvas', new mongoose.Schema({ 
    data: Array 
}, { timestamps: true }));

// Загрузка данных при старте
async function initCanvas() {
    try {
        let saved = await CanvasModel.findOne();
        if (saved && saved.data) {
            canvasData = saved.data;
            console.log("💾 Данные загружены из облака!");
        } else {
            // Если в базе совсем пусто, создаем первую запись
            await new CanvasModel({ data: canvasData }).save();
            console.log("🆕 Создан новый холст в базе");
        }
    } catch (err) {
        console.error("⚠️ Ошибка инициализации:", err);
    }
}

app.use(express.static('public'));

io.on('connection', (socket) => {
    // СРАЗУ отправляем текущие точки новому игроку
    socket.emit('init', canvasData);

    socket.on('placePixel', async (data) => {
        const { x, y, color } = data;

        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            canvasData[x][y] = color;
            
            // 1. Моментально рассылаем всем (чтобы не лагало)
            io.emit('updatePixel', { x, y, color });

            // 2. Сохраняем в базу (обновляем единственный документ)
            try {
                await CanvasModel.findOneAndUpdate({}, { data: canvasData });
            } catch (e) {
                console.error("Ошибка сохранения:", e);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));