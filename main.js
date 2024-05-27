const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Cargar imágenes
const shipImage = new Image();
shipImage.src = 'nave.png'; // Reemplaza 'nave.png' con la ruta de tu imagen de nave
const asteroidImage = new Image();
asteroidImage.src = 'asteroide.png'; // Reemplaza 'asteroide.png' con la ruta de tu imagen de asteroide

// Cargar audios
const audioExplosion = new Audio('explosion.mp3');
const audioLevelUp = new Audio('level_up.mp3');
const audioShoot = new Audio('laser.mp3');

canvas.width = window.innerWidth * 0.75;
canvas.height = window.innerHeight;

const ship = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    lives: 3,
};

const lasers = [];
const asteroids = [];
const particles = [];
let score = 0;
let gameOver = false;
let level = 1;
let asteroidCount = 5;
let showLevelMessage = false;
let minimapEnabled = true;

function moveShip() {
    ship.x += ship.dx;
    ship.y += ship.dy;

    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.width > canvas.width) ship.x = canvas.width - ship.width;
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.height > canvas.height) ship.y = canvas.height - ship.height;
}

function keyDown(e) {
    if (e.key === 'w' || e.key === 'ArrowUp') ship.dy = -ship.speed;
    if (e.key === 's' || e.key === 'ArrowDown') ship.dy = ship.speed;
    if (e.key === 'a' || e.key === 'ArrowLeft') ship.dx = -ship.speed;
    if (e.key === 'd' || e.key === 'ArrowRight') ship.dx = ship.speed;
}

function keyUp(e) {
    if (e.key === 'w' || e.key === 'ArrowUp' || e.key === 's' || e.key === 'ArrowDown') ship.dy = 0;
    if (e.key === 'a' || e.key === 'ArrowLeft' || e.key === 'd' || e.key === 'ArrowRight') ship.dx = 0;
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - (ship.x + ship.width / 2);
    const dy = mouseY - ship.y;
    const angle = Math.atan2(dy, dx);
    const speed = 10;

    lasers.push({
        x: ship.x + ship.width / 2,
        y: ship.y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed
    });

    if (audioShoot.readyState === 4) {
        audioShoot.currentTime = 0; // Reinicia la reproducción
        audioShoot.play();
    }
});

function updateLasers() {
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        laser.x += laser.dx;
        laser.y += laser.dy;

        if (laser.x < 0 || laser.x > canvas.width || laser.y < 0 || laser.y > canvas.height) {
            lasers.splice(i, 1);
        }
    }
}

function drawLasers() {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;
    lasers.forEach(laser => {
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.x - laser.dx, laser.y - laser.dy);
        ctx.stroke();
    });
}

function createAsteroid() {
    const x = Math.random() * canvas.width;
    const y = 0;
    const size = level === 1 ? Math.random() * 30 + 20 : Math.random() * 30 + 50;
    const speed = Math.random() * 3 + 1;

    asteroids.push({ x, y, size, speed });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2,
            size: Math.random() * 2 + 1,
            color: color,
            life: 30
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.y += asteroid.speed;

        if (asteroid.y > canvas.height) {
            asteroids.splice(i, 1);
            score--;
        }
    }
}

function detectCollisions() {
    for (let l = lasers.length - 1; l >= 0; l--) {
        const laser = lasers[l];
        for (let a = asteroids.length - 1; a >= 0; a--) {
            const asteroid = asteroids[a];
            const dx = asteroid.x - laser.x;
            const dy = asteroid.y - laser.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < asteroid.size) {
                createParticles(asteroid.x, asteroid.y, 'gray');
                if (level > 1 && asteroid.size > 25) {
                    splitAsteroid(asteroid);
                }
                asteroids.splice(a, 1);
                lasers.splice(l, 1);
                score++;
                audioExplosion.play();
                break;
            }
        }
    }
}

function splitAsteroid(asteroid) {
    const pieces = 2;
    for (let i = 0; i < pieces; i++) {
        const size = asteroid.size / 2;
        const speed = Math.random() * 3 + 1;
        const angle = Math.random() * Math.PI * 2;
        asteroids.push({
            x: asteroid.x,
            y: asteroid.y,
            size,
            speed,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed
        });
    }
}

function detectShipCollisions() {
    asteroids.forEach((asteroid, index) => {
        const dx = asteroid.x - (ship.x + ship.width / 2);
        const dy = asteroid.y - (ship.y + ship.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < asteroid.size + ship.width / 2) {
            createParticles(ship.x, ship.y, 'red');
            asteroids.splice(index, 1);
            ship.lives--;
            audioExplosion.play();
            if (ship.lives <= 0) {
                gameOver = true;
            }
        }
    });
}

function drawShip() {
    ctx.drawImage(shipImage, ship.x, ship.y, ship.width, ship.height);
}

function drawLives() {
    const lifeSize = 20;
    const padding = 10;
    const startX = canvas.width - (ship.lives * (lifeSize + padding));
    const startY = canvas.height - lifeSize - padding;

    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'white';

    for (let i = 0; i < ship.lives; i++) {
        ctx.fillRect(startX + (lifeSize + padding) * i, startY, lifeSize, lifeSize);
        ctx.strokeRect(startX + (lifeSize + padding) * i, startY, lifeSize, lifeSize);
    }
}

function drawAsteroids() {
    asteroids.forEach(asteroid => {
        ctx.drawImage(asteroidImage, asteroid.x - asteroid.size, asteroid.y - asteroid.size, asteroid.size * 2, asteroid.size * 2);
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 40);
    ctx.fillText(`Level: ${level}`, canvas.width - 100, 40);
}

function drawLevelMessage() {
    if (showLevelMessage) {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText(`Level ${level}`, canvas.width / 2 - 100, canvas.height / 2);
        setTimeout(() => {
            showLevelMessage = false;
        }, 2000);
    }
}

function drawMinimap() {
    if (minimapEnabled) {
        const minimapSize = 140;
        const minimapPadding = 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(minimapPadding, canvas.height - minimapSize - minimapPadding, minimapSize, minimapSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(minimapPadding, canvas.height - minimapSize - minimapPadding, minimapSize, minimapSize);

        ctx.fillStyle = 'blue';
        ctx.fillRect((ship.x / canvas.width) * minimapSize + minimapPadding, (ship.y / canvas.height) * minimapSize + canvas.height - minimapSize - minimapPadding, 10, 10);

        asteroids.forEach(asteroid => {
            ctx.fillStyle = 'gray';
            ctx.fillRect((asteroid.x / canvas.width) * minimapSize + minimapPadding, (asteroid.y / canvas.height) * minimapSize + canvas.height - minimapSize - minimapPadding, 5, 5);
        });
    }
}

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

setInterval(() => {
    if (asteroids.length < asteroidCount) {
        createAsteroid();
    }
}, 1000);

function increaseLevel() {
    if (score >= level * 10) {
        level++;
        asteroidCount += 2;
        showLevelMessage = true;
        audioLevelUp.play();
    }
}

function update() {
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    moveShip();
    updateLasers();
    updateAsteroids();
    updateParticles();
    detectCollisions();
    detectShipCollisions();
    drawBackground();
    drawShip();
    drawLives();
    drawLasers();
    drawAsteroids();
    drawParticles();
    drawScore();
    drawLevelMessage();
    drawMinimap();
    increaseLevel();

    requestAnimationFrame(update);
}

update();
