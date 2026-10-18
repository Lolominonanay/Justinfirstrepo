const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const scoreDisplay = document.querySelector("#score");
const statusDisplay = document.querySelector("#game-status");
const startButton = document.querySelector("#start-button");

const GAME_WIDTH = 360;
const GAME_HEIGHT = 600;
const FLOOR_HEIGHT = 48;
const FLOOR_Y = GAME_HEIGHT - FLOOR_HEIGHT;
const BIRD_X = 94;
const BIRD_RADIUS = 13;
const PIPE_WIDTH = 62;
const PIPE_GAP = 164;
const GRAVITY = 1450;
const FLAP_STRENGTH = -430;
const PIPE_SPEED = 155;
const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

let birdY = GAME_HEIGHT * 0.42;
let birdVelocity = 0;
let pipes = [];
let score = 0;
let gameState = "ready";
let lastFrame = 0;
let spawnTimer = 0;

if (!context) {
  throw new Error("This browser does not support the canvas needed for the game.");
}

canvas.width = GAME_WIDTH * pixelRatio;
canvas.height = GAME_HEIGHT * pixelRatio;
context.scale(pixelRatio, pixelRatio);

function updateStatus() {
  if (gameState === "ready") {
    statusDisplay.textContent = "Tap, click, or press Space to flap";
    startButton.textContent = "Start game";
    startButton.hidden = false;
  } else if (gameState === "running") {
    statusDisplay.textContent = "Keep flapping and avoid the pipes";
    startButton.hidden = true;
  } else {
    statusDisplay.textContent = `Game over. Your score: ${score}`;
    startButton.textContent = "Play again";
    startButton.hidden = false;
  }
}

function beginGame() {
  birdY = GAME_HEIGHT * 0.42;
  birdVelocity = FLAP_STRENGTH;
  pipes = [];
  score = 0;
  spawnTimer = 0.65;
  scoreDisplay.textContent = "0";
  gameState = "running";
  updateStatus();
}

function flap() {
  if (gameState === "ready" || gameState === "over") {
    beginGame();
    return;
  }
  birdVelocity = FLAP_STRENGTH;
}

function endGame() {
  if (gameState !== "running") return;
  gameState = "over";
  updateStatus();
}

function spawnPipe() {
  const margin = 72;
  const topHeight = margin + Math.random() * (FLOOR_Y - PIPE_GAP - margin * 2);
  pipes.push({ x: GAME_WIDTH + 12, topHeight, passed: false });
}

function update(delta) {
  if (gameState !== "running") return;

  birdVelocity += GRAVITY * delta;
  birdY += birdVelocity * delta;

  spawnTimer -= delta;
  if (spawnTimer <= 0) {
    spawnPipe();
    spawnTimer = 1.55;
  }

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED * delta;

    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
      pipe.passed = true;
      score += 1;
      scoreDisplay.textContent = String(score);
    }

    const overlapsBird = BIRD_X + BIRD_RADIUS > pipe.x && BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH;
    const missesGap = birdY - BIRD_RADIUS < pipe.topHeight || birdY + BIRD_RADIUS > pipe.topHeight + PIPE_GAP;
    if (overlapsBird && missesGap) endGame();
  }

  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > -10);
  if (birdY - BIRD_RADIUS < 0 || birdY + BIRD_RADIUS > FLOOR_Y) endGame();
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, "#171329");
  gradient.addColorStop(0.55, "#24203d");
  gradient.addColorStop(1, "#343050");
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  context.fillStyle = "rgb(255 255 255 / 28%)";
  for (let i = 0; i < 22; i += 1) {
    const x = (i * 79 + 26) % GAME_WIDTH;
    const y = (i * 131 + 35) % (FLOOR_Y - 50);
    context.beginPath();
    context.arc(x, y, i % 4 === 0 ? 1.7 : 1, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "rgb(255 255 255 / 5%)";
  context.beginPath();
  context.ellipse(285, 146, 110, 36, -0.3, 0, Math.PI * 2);
  context.fill();
}

function drawPipe(pipe) {
  const pipeGradient = context.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  pipeGradient.addColorStop(0, "#9f5bff");
  pipeGradient.addColorStop(0.5, "#ce78ff");
  pipeGradient.addColorStop(1, "#7840d8");
  context.fillStyle = pipeGradient;

  context.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight - 14);
  context.fillRect(pipe.x - 5, pipe.topHeight - 14, PIPE_WIDTH + 10, 14);
  context.fillRect(pipe.x, pipe.topHeight + PIPE_GAP + 14, PIPE_WIDTH, FLOOR_Y);
  context.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 14);

  context.fillStyle = "rgb(255 255 255 / 18%)";
  context.fillRect(pipe.x + 9, 0, 5, pipe.topHeight - 16);
  context.fillRect(pipe.x + 9, pipe.topHeight + PIPE_GAP + 16, 5, FLOOR_Y);
}

function drawBird() {
  context.save();
  context.translate(BIRD_X, birdY);
  context.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 5, birdVelocity / 950)));

  context.fillStyle = "#ffd166";
  context.beginPath();
  context.ellipse(0, 0, BIRD_RADIUS + 2, BIRD_RADIUS, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff9f43";
  context.beginPath();
  context.ellipse(-5, 5, 7, 4.5, -0.25, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#fff";
  context.beginPath();
  context.arc(6, -4, 5.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#211b35";
  context.beginPath();
  context.arc(8, -4, 2.3, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff6b8a";
  context.beginPath();
  context.moveTo(11, 2);
  context.lineTo(22, 5);
  context.lineTo(11, 9);
  context.closePath();
  context.fill();
  context.restore();
}

function drawFloor() {
  context.fillStyle = "#171421";
  context.fillRect(0, FLOOR_Y, GAME_WIDTH, FLOOR_HEIGHT);
  context.fillStyle = "#ff9ac1";
  context.fillRect(0, FLOOR_Y, GAME_WIDTH, 3);
  context.fillStyle = "rgb(203 186 255 / 22%)";
  for (let x = -20; x < GAME_WIDTH + 20; x += 28) {
    context.fillRect(x, FLOOR_Y + 17, 12, 3);
    context.fillRect(x + 12, FLOOR_Y + 34, 12, 3);
  }
}

function drawOverlay() {
  if (gameState === "running") return;
  context.fillStyle = "rgb(8 9 13 / 38%)";
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.textAlign = "center";
  context.fillStyle = "#fff";
  context.font = "700 30px Segoe UI, sans-serif";
  context.fillText(gameState === "ready" ? "Ready to fly?" : "Nice try!", GAME_WIDTH / 2, 240);
  context.fillStyle = "#e1d9f4";
  context.font = "16px Segoe UI, sans-serif";
  context.fillText(gameState === "ready" ? "Flap through the gaps" : `Score: ${score}`, GAME_WIDTH / 2, 270);
}

function draw() {
  context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBackground();
  for (const pipe of pipes) drawPipe(pipe);
  drawFloor();
  drawBird();
  drawOverlay();
}

function frame(timestamp) {
  const delta = lastFrame === 0 ? 0 : Math.min((timestamp - lastFrame) / 1000, 0.032);
  lastFrame = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  flap();
});

startButton.addEventListener("click", () => {
  flap();
  canvas.focus({ preventScroll: true });
});

window.addEventListener("keydown", event => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
});

updateStatus();
requestAnimationFrame(frame);
