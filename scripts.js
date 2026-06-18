const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// Configuracoes principais de fisica e espacamento dos obstaculos.
const GROUND_Y = Math.round(H * 0.875);
const GRAVITY = 1850;
const FLAP = -560;
const PIPE_SPEED = 178;
const PIPE_SPACING = 235;
const GAP_MIN = 165;
const GAP_MAX = 205;

const sprites = new Image();
const configSprites = new Image();
const mapa = new Image();
sprites.src = "assets/sprites.png";
configSprites.src = "assets/sprites_config.png";
mapa.src = "assets/mapa.png";

const music = new Audio("assets/music.mp3");
music.loop = true;
music.preload = "auto";

const wingSound = new Audio("assets/sfx_wing.mp3");
wingSound.preload = "auto";

// Coordenadas dos sprites dentro da imagem sprites.png.
const S = {
  title: { x: 351, y: 91, w: 88, h: 24 },
  getReady: { x: 292, y: 58, w: 99, h: 25 },
  gameOver: { x: 395, y: 58, w: 92, h: 25 },
  start: { x: 354, y: 118, w: 52, h: 29 },
  pipeDown: { x: 56, y: 323, w: 26, h: 160 },
  pipeUp: { x: 84, y: 323, w: 26, h: 160 },
  birds: [
    { x: 115, y: 329, w: 18, h: 12 },
    { x: 115, y: 355, w: 18, h: 12 },
    { x: 115, y: 381, w: 18, h: 12 }
  ]
};

const C = {
  gear: { x: 185, y: 72, w: 206, h: 202 }
};

// Areas clicaveis do canvas, usadas tanto para mouse quanto para toque.
const ui = {
  playMenu: { x: W / 2 - 80, y: 484, w: 160, h: 96 },
  playGameOver: { x: W / 2 - 80, y: 558, w: 160, h: 104 },
  homeGameOver: { x: W / 2 - 78, y: 668, w: 156, h: 48 },
  config: { x: W - 76, y: 24, w: 54, h: 54 },
  closeConfig: { x: W / 2 + 113, y: 205, w: 38, h: 38 },
  volumeTrack: { x: W / 2 - 126, y: 385, w: 252, h: 18 },
  draggingVolume: false
};

const state = {
  mode: "loading",
  bird: { x: 108, y: H * 0.43, vy: 0, rot: 0, frame: 0 },
  pipes: [],
  bgX: 0,
  time: 0,
  distance: 0,
  best: Number(localStorage.getItem("flappy-map-best") || 0),
  volume: Number(localStorage.getItem("flappy-map-volume") || 0.28),
  showConfig: false,
  readyUntil: 0,
  deadAt: 0
};

let last = 0;
let raf = 0;

setVolume(state.volume);

// Prepara uma nova partida, reposicionando o passaro e criando os primeiros canos.
function resetRun() {
  state.bird.x = 108;
  state.bird.y = H * 0.43;
  state.bird.vy = 0;
  state.bird.rot = 0;
  state.bird.frame = 0;
  state.pipes = [];
  state.time = 0;
  state.distance = 0;
  state.readyUntil = performance.now() + 1050;
  addPipe(W + 70);
  addPipe(W + 70 + PIPE_SPACING);
}

// Cria um obstaculo com abertura aleatoria, mas sempre dentro de uma area jogavel.
function addPipe(x) {
  const marginTop = 105;
  const marginBottom = 92;
  const gap = random(GAP_MIN, GAP_MAX);
  const centerMin = marginTop + gap / 2;
  const centerMax = GROUND_Y - marginBottom - gap / 2;
  const center = random(centerMin, centerMax);
  state.pipes.push({ x, gap, center, passed: false });
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function startGame() {
  resetRun();
  state.showConfig = false;
  state.mode = "ready";
  playMusic();
}

// Volta para a tela inicial sem apagar o recorde salvo.
function goToMenu() {
  state.mode = "menu";
  state.showConfig = false;
  state.pipes = [];
  state.time = 0;
  state.distance = 0;
  state.bird.x = 108;
  state.bird.y = H * 0.49;
  state.bird.vy = 0;
  state.bird.rot = 0;
}

// Aplica o impulso do pulo e toca o efeito sonoro.
function flap() {
  if (state.mode === "ready") {
    state.mode = "playing";
  }

  if (state.mode === "playing") {
    state.bird.vy = FLAP;
    playWingSound();
  }
}

// Finaliza a partida e salva o melhor resultado no navegador.
function gameOver() {
  state.mode = "gameover";
  state.showConfig = false;
  state.deadAt = performance.now();
  if (state.distance > state.best) {
    state.best = Math.floor(state.distance);
    localStorage.setItem("flappy-map-best", String(state.best));
  }
}

// Atualiza fisica, distancia, animacoes e geracao infinita dos obstaculos.
function update(dt, now) {
  state.bgX -= PIPE_SPEED * 0.18 * dt;

  if (state.mode === "ready" && now > state.readyUntil) {
    state.mode = "playing";
  }

  if (state.mode === "playing") {
    state.time += dt;
    state.distance += PIPE_SPEED * dt * 0.12;
    state.bird.vy += GRAVITY * dt;
    state.bird.y += state.bird.vy * dt;
    state.bird.rot = Math.max(-0.45, Math.min(1.35, state.bird.vy / 540));
    state.pipes.forEach((pipe) => {
      pipe.x -= PIPE_SPEED * dt;
      if (!pipe.passed && pipe.x + 58 < state.bird.x) {
        pipe.passed = true;
      }
    });

    while (state.pipes.length && state.pipes[0].x < -90) {
      state.pipes.shift();
    }

    const furthestPipeX = state.pipes.reduce((max, pipe) => Math.max(max, pipe.x), W + 45);
    if (furthestPipeX < W + PIPE_SPACING) {
      addPipe(furthestPipeX + PIPE_SPACING + random(-18, 22));
    }

    if (hitGround() || hitPipes()) {
      gameOver();
    }
  } else if (state.mode === "menu") {
    state.bird.y = H * 0.49 + Math.sin(now / 260) * 8;
    state.bird.rot = Math.sin(now / 340) * 0.08;
  }

  state.bird.frame = Math.floor(now / 105) % S.birds.length;
}

function hitGround() {
  return state.bird.y + 22 >= GROUND_Y || state.bird.y - 18 <= 0;
}

// Verifica colisao por caixas retangulares entre o passaro e os canos.
function hitPipes() {
  const bx = state.bird.x - 16;
  const by = state.bird.y - 13;
  const bw = 33;
  const bh = 25;

  return state.pipes.some((pipe) => {
    const px = pipe.x;
    const pw = 58;
    const topH = pipe.center - pipe.gap / 2;
    const botY = pipe.center + pipe.gap / 2;
    const overlapsX = bx < px + pw && bx + bw > px;
    const topHit = by < topH;
    const bottomHit = by + bh > botY;
    return overlapsX && (topHit || bottomHit);
  });
}

// Desenha a cena completa a cada quadro da animacao.
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawMap();
  if (state.mode === "ready" || state.mode === "playing") {
    drawPipes();
  }
  drawBird();
  drawHud();
  drawOverlay();
}

// Desenha o mapa em repeticao horizontal para criar o efeito infinito.
function drawMap() {
  if (!mapa.complete) {
    ctx.fillStyle = "#48c8f0";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const scale = H / mapa.height;
  const tileW = mapa.width * scale;
  let x = state.bgX % tileW;
  if (x > 0) x -= tileW;

  while (x < W) {
    ctx.drawImage(mapa, x, 0, tileW, H);
    x += tileW;
  }
}

// Desenha canos ancorados no topo e no chao, variando conforme a abertura.
function drawPipes() {
  state.pipes.forEach((pipe) => {
    const x = Math.round(pipe.x);
    const topBottom = pipe.center - pipe.gap / 2;
    const bottomTop = pipe.center + pipe.gap / 2;
    drawPipe(S.pipeDown, x, 0, 58, topBottom);
    drawPipe(S.pipeUp, x, bottomTop, 58, GROUND_Y - bottomTop + 18);
  });
}

function drawPipe(sprite, x, y, w, h) {
  if (!sprites.complete) return;
  ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h, x, y, w, h);
}

function drawBird() {
  const b = S.birds[state.bird.frame];
  ctx.save();
  ctx.translate(state.bird.x, state.bird.y);
  ctx.rotate(state.bird.rot);
  if (sprites.complete) {
    ctx.drawImage(sprites, b.x, b.y, b.w, b.h, -22, -15, 44, 30);
  } else {
    ctx.fillStyle = "#f8d24a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHud() {
  if (state.mode === "playing" || state.mode === "ready") {
    drawPixelText(`${Math.floor(state.distance)}m`, W / 2, 56, 34, "center", "#fff");
    drawPixelText(`${state.time.toFixed(1)}s`, W / 2, 91, 18, "center", "#fff");
  }
}

function drawOverlay() {
  if (!sprites.complete) return;

  if (state.mode === "loading") {
    drawPixelText("Carregando", W / 2, H / 2, 25, "center", "#fff");
    return;
  }

  if (state.mode === "menu") {
    drawSprite(S.title, W / 2 - 113, 132, 226, 62);
    drawConfigButton();
    drawBird();
    drawSprite(S.start, W / 2 - 70, 494, 140, 78);
    drawPixelText("CLIQUE NO PLAY", W / 2, 602, 18, "center", "#fff");
    drawPixelText(`Recorde ${state.best}m`, W / 2, 636, 18, "center", "#fff");
  }

  if (state.mode === "ready") {
    drawSprite(S.getReady, W / 2 - 139, 142, 278, 70);
  }

  if (state.mode === "gameover") {
    const drop = Math.min(1, (performance.now() - state.deadAt) / 320);
    const titleY = 120 + easeOutBack(drop) * 44;
    drawConfigButton();
    drawSprite(S.gameOver, W / 2 - 124, titleY, 248, 68);
    drawScoreBoard();
    drawSprite(S.start, W / 2 - 70, 568, 140, 78);
    drawHomeButton();
  }

  if (state.showConfig && (state.mode === "menu" || state.mode === "gameover")) {
    drawConfigPanel();
  }
}

function drawConfigButton() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.strokeStyle = "rgba(54, 48, 45, 0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(ui.config.x, ui.config.y, ui.config.w, ui.config.h, 8);
  ctx.fill();
  ctx.stroke();
  if (configSprites.complete) {
    ctx.drawImage(configSprites, C.gear.x, C.gear.y, C.gear.w, C.gear.h, ui.config.x + 8, ui.config.y + 8, 38, 38);
  } else {
    drawPixelText("*", ui.config.x + 27, ui.config.y + 30, 30, "center", "#333");
  }
  ctx.restore();
}

function drawHomeButton() {
  const rect = ui.homeGameOver;
  ctx.save();
  ctx.fillStyle = "#f8f8f8";
  ctx.strokeStyle = "#6b4750";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawPixelText("INICIO", rect.x + rect.w / 2, rect.y + rect.h / 2, 21, "center", "#2f9b42");
}

function drawConfigPanel() {
  const x = W / 2 - 164;
  const y = 194;
  ctx.save();
  ctx.fillStyle = "rgba(20, 27, 38, 0.45)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f7f3d6";
  ctx.strokeStyle = "#4b3b5b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, 328, 278, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillRect(x + 8, y + 8, 312, 48);
  ctx.restore();

  drawPixelText("CONFIG", W / 2, y + 35, 25, "center", "#df6f27");
  drawPixelText("VOLUME", W / 2, y + 128, 20, "center", "#4f453c");
  drawVolumeSlider();
  drawPixelText(`${Math.round(state.volume * 100)}%`, W / 2, y + 226, 24, "center", "#fff");
  drawPixelText("X", ui.closeConfig.x + ui.closeConfig.w / 2, ui.closeConfig.y + ui.closeConfig.h / 2, 26, "center", "#fff");
}

function drawVolumeSlider() {
  const track = ui.volumeTrack;
  const knobX = track.x + track.w * state.volume;
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "#30343b";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(track.x, track.y);
  ctx.lineTo(track.x + track.w, track.y);
  ctx.stroke();
  ctx.strokeStyle = "#57c834";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(track.x, track.y);
  ctx.lineTo(knobX, track.y);
  ctx.stroke();
  ctx.fillStyle = "#f5f5f5";
  ctx.strokeStyle = "#646464";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(knobX, track.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawScoreBoard() {
  const x = W / 2 - 168;
  const y = 253;
  ctx.save();
  ctx.fillStyle = "#dedb94";
  ctx.strokeStyle = "#4b3b5b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, 336, 170, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 247, 166, 0.28)";
  ctx.fillRect(x + 8, y + 8, 320, 36);
  ctx.restore();

  drawPixelText("DISTANCIA", W / 2, y + 38, 18, "center", "#df6f27");
  drawPixelText(`${Math.floor(state.distance)}m`, W / 2, y + 76, 32, "center", "#fff");
  drawPixelText("TEMPO", W / 2, y + 112, 18, "center", "#df6f27");
  drawPixelText(`${state.time.toFixed(1)}s`, W / 2, y + 145, 28, "center", "#fff");
  drawPixelText(`BEST ${state.best}m`, W / 2, y + 205, 20, "center", "#fff");
}

function drawSprite(sprite, x, y, w, h) {
  ctx.drawImage(sprites, sprite.x, sprite.y, sprite.w, sprite.h, x, y, w, h);
}

function drawPixelText(text, x, y, size, align = "left", color = "#fff") {
  ctx.save();
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(46, 38, 30, 0.75)";
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000 || 0);
  last = now;
  update(dt, now);
  draw();
  raf = requestAnimationFrame(loop);
}

function pointerToGame(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * W;
  const y = ((clientY - rect.top) / rect.height) * H;
  return { x, y };
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function pointInStartButton(clientX, clientY) {
  const p = pointerToGame(clientX, clientY);
  const rect = state.mode === "gameover" ? ui.playGameOver : ui.playMenu;
  return pointInRect(p.x, p.y, rect);
}

function setVolume(value) {
  state.volume = Math.max(0, Math.min(1, value));
  music.volume = state.volume;
  wingSound.volume = Math.min(1, state.volume + 0.12);
  localStorage.setItem("flappy-map-volume", String(state.volume));
}

function updateVolumeFromPointer(clientX, clientY) {
  const p = pointerToGame(clientX, clientY);
  const track = ui.volumeTrack;
  setVolume((p.x - track.x) / track.w);
}

function playMusic() {
  music.play().catch(() => {});
}

function playWingSound() {
  const sound = wingSound.cloneNode();
  sound.volume = Math.min(1, state.volume + 0.12);
  sound.play().catch(() => {});
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    if (state.mode === "ready" || state.mode === "playing") {
      flap();
    }
  }
});

canvas.addEventListener("pointerdown", (event) => {
  const p = pointerToGame(event.clientX, event.clientY);

  if ((state.mode === "menu" || state.mode === "gameover") && state.showConfig) {
    if (pointInRect(p.x, p.y, ui.closeConfig)) {
      state.showConfig = false;
      return;
    }

    const hitSlider = p.x >= ui.volumeTrack.x - 28 && p.x <= ui.volumeTrack.x + ui.volumeTrack.w + 28 &&
      p.y >= ui.volumeTrack.y - 34 && p.y <= ui.volumeTrack.y + 34;
    if (hitSlider) {
      ui.draggingVolume = true;
      updateVolumeFromPointer(event.clientX, event.clientY);
      playMusic();
    }
    return;
  }

  if (state.mode === "menu" || state.mode === "gameover") {
    if (pointInRect(p.x, p.y, ui.config)) {
      state.showConfig = true;
      playMusic();
      return;
    }

    if (state.mode === "gameover" && pointInRect(p.x, p.y, ui.homeGameOver)) {
      goToMenu();
      return;
    }

    if (pointInStartButton(event.clientX, event.clientY)) {
      startGame();
    }
    return;
  }

  flap();
});

canvas.addEventListener("pointermove", (event) => {
  if (ui.draggingVolume) {
    updateVolumeFromPointer(event.clientX, event.clientY);
  }
});

window.addEventListener("pointerup", () => {
  ui.draggingVolume = false;
});

Promise.all([
  new Promise((resolve) => (sprites.onload = resolve)),
  new Promise((resolve) => (configSprites.onload = resolve)),
  new Promise((resolve) => (mapa.onload = resolve))
]).then(() => {
  state.mode = "menu";
});

raf = requestAnimationFrame(loop);
