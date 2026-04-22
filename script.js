const socket = io();
const canvas = document.getElementById('canvas'); // Убедись, что в HTML id="canvas"
const ctx = canvas.getContext('2d');
const pixelSize = 5; // Размер одного пикселя (настрой под себя)
let currentColor = '#000000';

// 1. ПОЛУЧАЕМ ВЕСЬ ХОЛСТ ПРИ ЗАХОДЕ
socket.on('init', (data) => {
    console.log("Холст получен от сервера");
    // Рисуем всё поле сразу
    for (let x = 0; x < data.length; x++) {
        for (let y = 0; y < data[x].length; y++) {
            ctx.fillStyle = data[x][y];
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
});

// 2. ПОЛУЧАЕМ ОДНУ ТОЧКУ ОТ ДРУГОГО ИГРОКА
socket.on('updatePixel', (data) => {
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x * pixelSize, data.y * pixelSize, pixelSize, pixelSize);
});

// 3. ОТПРАВЛЯЕМ ТОЧКУ ПРИ КЛИКЕ
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);

    // Рисуем у себя сразу (для скорости)
    ctx.fillStyle = currentColor;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    // Отправляем на сервер
    socket.emit('placePixel', { x, y, color: currentColor });
});

// Функция для выбора цвета (если у тебя есть кнопки)
function setColor(color) {
    currentColor = color;
}