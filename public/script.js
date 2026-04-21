const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const posDisplay = document.getElementById('posDisplay');
const cooldownText = document.getElementById('cooldownText');

// --- НАСТРОЙКИ ---
const GRID_SIZE = 100;
const CELL_SIZE = canvas.width / GRID_SIZE; 
let currentColor = '#000000';
let canDraw = true;
let isAdmin = false; // По умолчанию мы обычный игрок
const COOLDOWN_TIME = 5000; // 5 секунд для друзей

// 1. Выбор цвета в палитре
document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        currentColor = e.target.dataset.color;
        document.getElementById('currentColorDisplay').style.background = currentColor;
    });
});

// 2. Функция рисования квадратика на холсте
function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// 3. Получение всего холста при заходе
socket.on('loadCanvas', (data) => {
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            drawPixel(x, y, data[x][y]);
        }
    }
});

// 4. Обновление пикселя, когда кто-то другой его поставил
socket.on('updatePixel', (data) => {
    drawPixel(data.x, data.y, data.color);
});

// 5. Отслеживание координат мышки
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    posDisplay.innerText = `${x}, ${y}`;
});

// 6. Клик по холсту (Ставим пиксель)
canvas.addEventListener('click', (e) => {
    if (!canDraw && !isAdmin) return; // Если не админ и ждем КД — выходим

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    // Отправляем данные на сервер
    socket.emit('placePixel', { x, y, color: currentColor });

    // Если ты админ, мы не запускаем таймер кулдауна
    if (!isAdmin) {
        startCooldown();
    }
});

// 7. Логика таймера (Кулдаун)
function startCooldown() {
    canDraw = false;
    let timeLeft = COOLDOWN_TIME / 1000;
    
    cooldownText.className = 'waiting';
    cooldownText.innerText = `Жди ${timeLeft} сек...`;
    
    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timer);
            canDraw = true;
            cooldownText.className = 'ready';
            cooldownText.innerText = 'Готов рисовать!';
        } else {
            cooldownText.innerText = `Жди ${timeLeft} сек...`;
        }
    }, 1000);
}

// --- СЕКЦИЯ АДМИНА ---

// Функция для консоли: activateAdmin("твой_пароль")
window.activateAdmin = function(pass) {
    socket.emit('becomeAdmin', pass);
};

// Если сервер сказал, что пароль верный
socket.on('adminSuccess', () => {
    isAdmin = true;
    canDraw = true;
    cooldownText.className = 'ready';
    cooldownText.style.color = '#ffaa00';
    cooldownText.innerText = 'РЕЖИМ БОГА АКТИВИРОВАН';
    console.log("Доступ разрешен. Теперь КД для тебя не существует!");
});