const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const GRID_SIZE = 100;

// 1. Создаем пустой холст сразу
let canvasData = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'));

// 2. ТВОЯ ИСПРАВЛЕННАЯ ССЫЛКА (Без лишнего слэша и с твоим ID)
const mongoURI = "mongodb+srv://kirilukoleg110_db_user:oleg4432@cluster0.4b7jsbj.mongodb.net/pixel_db?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
    .then(() => {
        console.log("✅ ПОБЕДА: База данных подключена успешно!");
        initCanvas();
    })
    .catch(err => {
        console.error("❌ ОШИБКА БАЗЫ:", err.message);
    });

const CanvasModel = mongoose.model('Canvas', new mongoose.Schema({ data: Array }));

async function initCanvas() {
    try {
        const saved = await CanvasModel.findOne();
        if (saved && saved.data) {
            canvasData = saved.data;
            console.log("💾 Данные из облака загружены на холст!");
        }
    } catch (err) {
        console.error("⚠️ Ошибка загрузки данных");
    }
}

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.emit('init', canvasData);
    socket.on('placePixel', async ({ x, y, color }) => {
        if (canvasData[x] && canvasData[x][y] !== undefined) {
            canvasData[x][y] = color;
            io.emit('updatePixel', { x, y, color });
            CanvasModel.findOneAndUpdate({}, { data: canvasData }, { upsert: true }).catch(() => {});
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Сервер на порту ${PORT}`));