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
const COINS_PER_METER = 10 / 100;

const sprites = new Image();
const configSprites = new Image();
const scoreSprites = new Image();
const shopSprites = new Image();
const logoImage = new Image();
const parrotRed = new Image();
const parrotYellow = new Image();
const coinGold = new Image();
const mapa = new Image();
sprites.src = "assets/sprites.png";
configSprites.src = "assets/sprites_config.png";
scoreSprites.src = "assets/sprites_score.png";
shopSprites.src = "assets/sprites_shop.png";
logoImage.src = "assets/logo.jpg";
parrotRed.src = "assets/parrot_red.png";
parrotYellow.src = "assets/parrot_yellow.png";
coinGold.src = "assets/coin_gold.png";
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

const SCORE_SPRITES = {
  board: { x: 78, y: 62, w: 744, h: 431 },
  smallBoard: { x: 912, y: 107, w: 439, h: 361 }
};

const SHOP_SPRITES = {
  button: { x: 85, y: 147, w: 391, h: 137 },
  panel: { x: 751, y: 380, w: 641, h: 523 }
};

const skins = [
  { id: "classic", name: "CLASSIC", type: "classic", price: 0 },
  { id: "arara-red", name: "ARARA R", type: "sheet", image: parrotRed, price: 100 },
  { id: "arara-yellow", name: "ARARA A", type: "sheet", image: parrotYellow, price: 150 }
];

const PARROT_FRAME_W = 190;
const PARROT_FRAME_H = 150;
const PARROT_SEQUENCE = [0, 1, 2, 3, 2, 1];
const PARROT_SHOP_FRAME = 1;
const PARROT_VISIBLE_BOUNDS = [
  { x: 15, y: 9, w: 160, h: 132 },
  { x: 9, y: 18, w: 172, h: 114 },
  { x: 9, y: 50, w: 172, h: 50 },
  { x: 9, y: 33, w: 172, h: 84 }
];

// Areas clicaveis do canvas, usadas tanto para mouse quanto para toque.
const ui = {
  playMenu: { x: W / 2 - 80, y: 484, w: 160, h: 96 },
  playGameOver: { x: W / 2 - 80, y: 558, w: 160, h: 104 },
  homeGameOver: { x: W / 2 - 78, y: 668, w: 156, h: 48 },
  playerName: { x: 54, y: 675, w: 180, h: 48 },
  ranking: { x: 248, y: 675, w: 130, h: 48 },
  shop: { x: 22, y: 24, w: 126, h: 44 },
  rankingGameOver: { x: 22, y: 24, w: 112, h: 54 },
  closeRanking: { x: W / 2 + 147, y: 91, w: 36, h: 36 },
  closeShop: { x: W / 2 + 150, y: 123, w: 34, h: 34 },
  config: { x: W - 76, y: 24, w: 54, h: 54 },
  closeConfig: { x: W / 2 + 113, y: 205, w: 38, h: 38 },
  volumeTrack: { x: W / 2 - 126, y: 385, w: 252, h: 18 },
  nameInput: { x: W / 2 - 132, y: 334, w: 264, h: 48 },
  nameOk: { x: W / 2 - 126, y: 408, w: 112, h: 46 },
  nameCancel: { x: W / 2 + 14, y: 408, w: 112, h: 46 },
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
  playerName: localStorage.getItem("flappy-map-player") || "PLAYER",
  coins: Number(localStorage.getItem("flappy-map-coins") || 0),
  ownedSkins: JSON.parse(localStorage.getItem("flappy-map-skins") || '["classic"]'),
  selectedSkin: localStorage.getItem("flappy-map-selected-skin") || "classic",
  volume: Number(localStorage.getItem("flappy-map-volume") || 0.28),
  showConfig: false,
  showRanking: false,
  showShop: false,
  showNamePanel: false,
  pendingPlayerName: "",
  runRewarded: false,
  readyUntil: 0,
  deadAt: 0
};

const nameInput = document.createElement("input");
nameInput.type = "text";
nameInput.maxLength = 12;
nameInput.autocomplete = "off";
nameInput.autocapitalize = "characters";
nameInput.spellcheck = false;
Object.assign(nameInput.style, {
  position: "fixed",
  opacity: "0",
  pointerEvents: "none",
  zIndex: "-1",
  width: "1px",
  height: "1px"
});
document.body.appendChild(nameInput);

// Jogadores simulados usados para montar o ranking top 10 em tempo real.
const simulatedPlayers = [
  { name: "LUNA", score: 910, speed: 1.2, limit: 1040 },
  { name: "KAI", score: 760, speed: 1.6, limit: 930 },
  { name: "MIA", score: 640, speed: 1.4, limit: 820 },
  { name: "NOAH", score: 520, speed: 1.8, limit: 720 },
  { name: "BIA", score: 430, speed: 1.1, limit: 610 },
  { name: "LEO", score: 350, speed: 1.5, limit: 520 },
  { name: "NINA", score: 260, speed: 1.2, limit: 430 },
  { name: "TOM", score: 190, speed: 0.9, limit: 330 },
  { name: "MAX", score: 120, speed: 1.4, limit: 260 }
].map((player) => {
  const score = player.score + Math.floor(Math.random() * 50);
  const limit = player.limit + Math.floor(Math.random() * 70);
  return { ...player, score, limit };
});

let last = 0;
let raf = 0;

if (!skins.some((skin) => skin.id === state.selectedSkin)) {
  state.selectedSkin = "classic";
}
state.ownedSkins = state.ownedSkins.filter((skinId) => skins.some((skin) => skin.id === skinId));
if (!state.ownedSkins.includes("classic")) {
  state.ownedSkins.unshift("classic");
}

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
  state.runRewarded = false;
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
  state.showRanking = false;
  state.showShop = false;
  state.showNamePanel = false;
  state.mode = "ready";
  playMusic();
}

// Volta para a tela inicial sem apagar o recorde salvo.
function goToMenu() {
  state.mode = "menu";
  state.showConfig = false;
  state.showRanking = false;
  state.showShop = false;
  state.showNamePanel = false;
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
  state.showRanking = false;
  state.showShop = false;
  state.showNamePanel = false;
  state.deadAt = performance.now();
  awardCoins();
  if (state.distance > state.best) {
    state.best = Math.floor(state.distance);
    localStorage.setItem("flappy-map-best", String(state.best));
  }
}

function awardCoins() {
  if (state.runRewarded) return;
  state.runRewarded = true;

  const earnedCoins = Math.floor(state.distance * COINS_PER_METER);
  if (earnedCoins <= 0) return;

  state.coins += earnedCoins;
  localStorage.setItem("flappy-map-coins", String(state.coins));
}

function getSelectedSkin() {
  return skins.find((skin) => skin.id === state.selectedSkin) || skins[0];
}

function ownsSkin(skinId) {
  return state.ownedSkins.includes(skinId);
}

function saveShopState() {
  localStorage.setItem("flappy-map-coins", String(state.coins));
  localStorage.setItem("flappy-map-skins", JSON.stringify(state.ownedSkins));
  localStorage.setItem("flappy-map-selected-skin", state.selectedSkin);
}

function buyOrEquipSkin(skin) {
  if (ownsSkin(skin.id)) {
    state.selectedSkin = skin.id;
    saveShopState();
    return;
  }

  if (state.coins >= skin.price) {
    state.coins -= skin.price;
    state.ownedSkins.push(skin.id);
    state.selectedSkin = skin.id;
    saveShopState();
  }
}

// Atualiza fisica, distancia, animacoes e geracao infinita dos obstaculos.
function update(dt, now) {
  state.bgX -= PIPE_SPEED * 0.18 * dt;
  updateSimulatedScores(dt);

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

// Atualiza os placares falsos aos poucos para simular outros jogadores em tempo real.
function updateSimulatedScores(dt) {
  simulatedPlayers.forEach((player) => {
    if (player.score < player.limit) {
      player.score = Math.min(player.limit, player.score + player.speed * dt);
    }
  });
}

function getPlayerRankingScore() {
  return Math.max(state.best, Math.floor(state.distance));
}

function getLeaderboard() {
  const currentPlayer = {
    name: state.playerName || "PLAYER",
    score: getPlayerRankingScore(),
    current: true
  };

  return [...simulatedPlayers, currentPlayer]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getPlayerRank() {
  const currentScore = getPlayerRankingScore();
  const aheadCount = simulatedPlayers.filter((player) => player.score > currentScore).length;
  return aheadCount + 1;
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
  const skin = getSelectedSkin();
  ctx.save();
  ctx.translate(state.bird.x, state.bird.y);
  ctx.rotate(state.bird.rot);
  if (skin.type === "sheet" && skin.image.complete) {
    const frame = PARROT_SEQUENCE[Math.floor(performance.now() / 95) % PARROT_SEQUENCE.length];
    const col = frame % 4;
    const row = Math.floor(frame / 4);
    ctx.drawImage(skin.image, col * PARROT_FRAME_W, row * PARROT_FRAME_H, PARROT_FRAME_W, PARROT_FRAME_H, -38, -30, 76, 60);
  } else if (sprites.complete) {
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
    drawPixelText(`#${getPlayerRank()} ${state.playerName.toUpperCase().slice(0, 8)}`, 22, 126, 16, "left", "#63db49");
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
    drawShopButton();
    drawConfigButton();
    drawBird();
    drawSprite(S.start, W / 2 - 70, 494, 140, 78);
    drawPixelText("CLIQUE NO PLAY", W / 2, 602, 18, "center", "#fff");
    drawPixelText(`Recorde ${state.best}m`, W / 2, 636, 18, "center", "#fff");
    drawMenuButtons();
  }

  if (state.mode === "ready") {
    drawSprite(S.getReady, W / 2 - 139, 142, 278, 70);
  }

  if (state.mode === "gameover") {
    const drop = Math.min(1, (performance.now() - state.deadAt) / 320);
    const titleY = 120 + easeOutBack(drop) * 44;
    drawPanelButton(ui.rankingGameOver, "TOP 10", "#df6f27", 16);
    drawConfigButton();
    drawSprite(S.gameOver, W / 2 - 124, titleY, 248, 68);
    drawScoreBoard();
    drawSprite(S.start, W / 2 - 70, 568, 140, 78);
    drawHomeButton();
  }

  if (state.showConfig && (state.mode === "menu" || state.mode === "gameover")) {
    drawConfigPanel();
  }

  if (state.showRanking && (state.mode === "menu" || state.mode === "gameover")) {
    drawRankingPanel();
  }

  if (state.showShop && state.mode === "menu") {
    drawShopPanel();
  }

  if (state.showNamePanel && (state.mode === "menu" || state.mode === "gameover")) {
    drawNamePanel();
  }
}

function drawLogo() {
  const x = W / 2 - 80;
  const y = 114;
  const size = 160;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(46, 38, 30, 0.75)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 18);
  ctx.fill();
  ctx.stroke();
  if (logoImage.complete) {
    ctx.drawImage(logoImage, x + 10, y + 10, size - 20, size - 20);
  }
  ctx.restore();
}

function drawShopButton() {
  const rect = ui.shop;
  if (shopSprites.complete) {
    ctx.drawImage(shopSprites, SHOP_SPRITES.button.x, SHOP_SPRITES.button.y, SHOP_SPRITES.button.w, SHOP_SPRITES.button.h, rect.x, rect.y, rect.w, rect.h);
  } else {
    drawOrangeButton(rect, "SHOP", 18);
  }
}

function drawMenuButtons() {
  drawPanelButton(ui.playerName, `NOME: ${state.playerName}`, "#2f6fd8", 15);
  drawPanelButton(ui.ranking, "TOP 10", "#df6f27", 18);
}

function drawPanelButton(rect, label, color, size) {
  ctx.save();
  ctx.fillStyle = "#f8f8f8";
  ctx.strokeStyle = "#6b4750";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawPixelText(label, rect.x + rect.w / 2, rect.y + rect.h / 2, size, "center", color);
}

function drawOrangeButton(rect, label, size) {
  ctx.save();
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  gradient.addColorStop(0, "#ff9f22");
  gradient.addColorStop(1, "#c74a1e");
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#6b2a1b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawPixelText(label, rect.x + rect.w / 2, rect.y + rect.h / 2, size, "center", "#fff");
}

function drawNamePanel() {
  const x = W / 2 - 164;
  const y = 246;
  const input = ui.nameInput;
  const cursorOn = Math.floor(performance.now() / 420) % 2 === 0;
  const nameText = state.pendingPlayerName || "";

  ctx.save();
  ctx.fillStyle = "rgba(20, 27, 38, 0.52)";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f7f3d6";
  ctx.strokeStyle = "#4b3b5b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, 328, 238, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillRect(x + 8, y + 8, 312, 48);

  ctx.fillStyle = "#fff8d7";
  ctx.strokeStyle = "#6b4750";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(input.x, input.y, input.w, input.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  drawPixelText("SEU NOME", W / 2, y + 35, 24, "center", "#df6f27");
  drawPixelText("Digite ate 12 letras", W / 2, y + 73, 13, "center", "#4f453c");
  drawPixelText(nameText || "PLAYER", input.x + 16, input.y + input.h / 2, 20, "left", nameText ? "#2f6fd8" : "rgba(47, 111, 216, 0.55)");

  if (cursorOn) {
    const cursorX = Math.min(input.x + input.w - 16, input.x + 18 + measurePixelText(nameText || "", 20));
    ctx.save();
    ctx.fillStyle = "#2f6fd8";
    ctx.fillRect(cursorX, input.y + 12, 3, input.h - 24);
    ctx.restore();
  }

  drawPanelButton(ui.nameOk, "OK", "#2f9b42", 18);
  drawPanelButton(ui.nameCancel, "CANCELAR", "#df6f27", 14);
}

function drawRankingPanel() {
  const x = W / 2 - 178;
  const y = 84;
  const w = 356;
  const h = 548;

  ctx.save();
  ctx.fillStyle = "rgba(20, 27, 38, 0.48)";
  ctx.fillRect(0, 0, W, H);
  if (scoreSprites.complete) {
    ctx.drawImage(scoreSprites, SCORE_SPRITES.board.x, SCORE_SPRITES.board.y, SCORE_SPRITES.board.w, SCORE_SPRITES.board.h, x, y, w, h);
  } else {
    ctx.fillStyle = "#f7df91";
    ctx.strokeStyle = "#6b3e19";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  drawPixelText("TOP 10", W / 2, y + 48, 30, "center", "#df6f27");
  drawPixelText("X", ui.closeRanking.x + ui.closeRanking.w / 2, ui.closeRanking.y + ui.closeRanking.h / 2, 24, "center", "#fff");

  const ranking = getLeaderboard();
  ranking.forEach((player, index) => {
    const rowY = y + 96 + index * 39;
    const rowColor = player.current ? "rgba(87, 200, 52, 0.28)" : "rgba(255, 255, 255, 0.18)";

    ctx.save();
    ctx.fillStyle = rowColor;
    ctx.beginPath();
    ctx.roundRect(x + 28, rowY - 17, w - 56, 31, 6);
    ctx.fill();
    ctx.restore();

    const medal = index === 0 ? "#ffd94a" : index === 1 ? "#d5dce7" : index === 2 ? "#d58c45" : "#ffffff";
    drawPixelText(`${index + 1}`, x + 52, rowY, 19, "center", medal);
    drawPixelText(player.name.toUpperCase().slice(0, 9), x + 83, rowY, 17, "left", player.current ? "#63db49" : "#fff");
    drawPixelText(`${Math.floor(player.score)}m`, x + w - 50, rowY, 17, "right", "#fff");
  });

  drawPixelText("Ranking simulado", W / 2, y + h - 34, 15, "center", "#fff");
}

function drawShopPanel() {
  const x = W / 2 - 190;
  const y = 112;
  const w = 380;
  const h = 486;

  ctx.save();
  ctx.fillStyle = "rgba(20, 27, 38, 0.48)";
  ctx.fillRect(0, 0, W, H);
  if (shopSprites.complete) {
    ctx.drawImage(shopSprites, SHOP_SPRITES.panel.x, SHOP_SPRITES.panel.y, SHOP_SPRITES.panel.w, SHOP_SPRITES.panel.h, x, y, w, h);
  } else {
    ctx.fillStyle = "#f7df91";
    ctx.strokeStyle = "#6b3e19";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  const coinText = `${state.coins}`;
  const coinFontSize = 19;
  const coinIconSize = Math.round(coinFontSize * 1.55);
  const coinGap = 5;
  const coinPadX = 9;
  const coinBoxH = 39;
  const coinTextW = measurePixelText(coinText, coinFontSize);
  const coinBoxW = Math.ceil(coinPadX * 2 + coinIconSize + coinGap + coinTextW);
  const coinBoxRight = ui.closeShop.x - 8;
  const coinBoxX = Math.max(x + w - 132, coinBoxRight - coinBoxW);
  const coinBoxY = y + 23;

  ctx.save();
  ctx.fillStyle = "#8b2a17";
  ctx.fillRect(coinBoxX, coinBoxY, coinBoxW, coinBoxH);
  if (coinGold.complete) {
    ctx.drawImage(
      coinGold,
      coinBoxX + coinPadX,
      coinBoxY + (coinBoxH - coinIconSize) / 2,
      coinIconSize,
      coinIconSize
    );
  }
  ctx.restore();
  drawPixelText(coinText, coinBoxX + coinBoxW - coinPadX, coinBoxY + coinBoxH / 2, coinFontSize, "right", "#fff");
  drawPixelText("X", ui.closeShop.x + ui.closeShop.w / 2, ui.closeShop.y + ui.closeShop.h / 2, 24, "center", "#fff");

  skins.forEach((skin, index) => {
    drawShopItem(skin, index);
  });

  drawPixelText("Ganhe moedas pela distancia", W / 2, y + h - 22, 14, "center", "#fff");
}

function drawShopItem(skin, index) {
  const rect = getShopSlotRect(index);
  const owned = ownsSkin(skin.id);
  const selected = state.selectedSkin === skin.id;

  ctx.save();
  ctx.fillStyle = selected ? "rgba(87, 200, 52, 0.22)" : "rgba(255, 255, 255, 0.2)";
  ctx.strokeStyle = selected ? "#57c834" : "rgba(120, 83, 35, 0.55)";
  ctx.lineWidth = selected ? 4 : 2;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const imageRect = getShopItemImageRect(rect);
  drawSkinPreview(imageRect.x, imageRect.y, imageRect.w, imageRect.h, skin);
  drawPixelText(skin.name, rect.x + rect.w / 2, rect.y + 69, 12, "center", "#fff");

  let label = `${skin.price}`;
  let color = "#fff";
  if (selected) {
    label = "EQUIP";
    color = "#63db49";
  } else if (owned) {
    label = "USAR";
    color = "#63db49";
  } else if (state.coins < skin.price) {
    label = "FALTA";
    color = "#ff6b5b";
  }
  drawPixelText(label, rect.x + rect.w / 2, rect.y + 91, 12, "center", color);
}

function drawSkinPreview(x, y, w, h, skin) {
  const b = S.birds[0];

  ctx.save();
  if (skin.type === "sheet" && skin.image.complete) {
    const frame = PARROT_SHOP_FRAME;
    const col = frame % 4;
    const row = Math.floor(frame / 4);
    const bounds = PARROT_VISIBLE_BOUNDS[frame];
    drawImageContained(
      skin.image,
      col * PARROT_FRAME_W + bounds.x,
      row * PARROT_FRAME_H + bounds.y,
      bounds.w,
      bounds.h,
      x,
      y,
      w,
      h
    );
  } else {
    drawImageContained(sprites, b.x, b.y, b.w, b.h, x, y, w, h);
  }
  ctx.restore();
}

function getShopItemImageRect(rect) {
  const previewW = rect.w - 12;
  const previewH = 48;
  return {
    x: rect.x + (rect.w - previewW) / 2,
    y: rect.y + 8,
    w: previewW,
    h: previewH
  };
}

function drawImageContained(image, sx, sy, sw, sh, x, y, w, h) {
  const scale = Math.min(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

function getShopSlotRect(index) {
  const startX = W / 2 - 153;
  const startY = 252;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    x: startX + col * 77,
    y: startY + row * 112,
    w: 64,
    h: 101
  };
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

function measurePixelText(text, size) {
  ctx.save();
  ctx.font = `800 ${size}px Arial, Helvetica, sans-serif`;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

function drawPixelText(text, x, y, size, align = "left", color = "#fff") {
  ctx.save();
  ctx.font = `800 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(46, 38, 30, 0.45)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = "rgba(46, 38, 30, 0.55)";
  ctx.lineWidth = Math.max(2, size * 0.08);
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

function openNamePanel() {
  state.pendingPlayerName = state.playerName === "PLAYER" ? "" : state.playerName;
  state.showNamePanel = true;
  state.showConfig = false;
  state.showRanking = false;
  state.showShop = false;
  syncNameInput();
  focusNameInput();
}

function closeNamePanel() {
  state.showNamePanel = false;
  nameInput.blur();
}

function confirmPlayerName() {
  const cleanName = cleanPlayerName(state.pendingPlayerName);
  state.playerName = cleanName || "PLAYER";
  localStorage.setItem("flappy-map-player", state.playerName);
  closeNamePanel();
}

function cleanPlayerName(name) {
  return name.trim().replace(/\s+/g, " ").slice(0, 12);
}

function syncNameInput() {
  nameInput.value = state.pendingPlayerName;
  updateNameInputPosition();
}

function updateNameInputPosition() {
  if (!state.showNamePanel) return;

  const rect = canvas.getBoundingClientRect();
  const input = ui.nameInput;
  nameInput.style.left = `${rect.left + (input.x / W) * rect.width}px`;
  nameInput.style.top = `${rect.top + (input.y / H) * rect.height}px`;
  nameInput.style.width = `${(input.w / W) * rect.width}px`;
  nameInput.style.height = `${(input.h / H) * rect.height}px`;
}

function focusNameInput() {
  updateNameInputPosition();
  requestAnimationFrame(() => {
    nameInput.focus({ preventScroll: true });
    nameInput.setSelectionRange(nameInput.value.length, nameInput.value.length);
  });
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
  if (state.showNamePanel) {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmPlayerName();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeNamePanel();
      return;
    }
  }

  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    if (state.mode === "ready" || state.mode === "playing") {
      flap();
    }
  }
});

canvas.addEventListener("pointerdown", (event) => {
  const p = pointerToGame(event.clientX, event.clientY);

  if (state.showNamePanel) {
    if (pointInRect(p.x, p.y, ui.nameOk)) {
      confirmPlayerName();
      return;
    }

    if (pointInRect(p.x, p.y, ui.nameCancel)) {
      closeNamePanel();
      return;
    }

    if (pointInRect(p.x, p.y, ui.nameInput)) {
      focusNameInput();
    }
    return;
  }

  if (state.mode === "menu" && state.showShop) {
    if (pointInRect(p.x, p.y, ui.closeShop)) {
      state.showShop = false;
      return;
    }

    const selectedIndex = skins.findIndex((_, index) => pointInRect(p.x, p.y, getShopSlotRect(index)));
    if (selectedIndex >= 0) {
      buyOrEquipSkin(skins[selectedIndex]);
    }
    return;
  }

  if ((state.mode === "menu" || state.mode === "gameover") && state.showRanking) {
    if (pointInRect(p.x, p.y, ui.closeRanking)) {
      state.showRanking = false;
    }
    return;
  }

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
    if (state.mode === "menu" && pointInRect(p.x, p.y, ui.shop)) {
      state.showShop = true;
      return;
    }

    if (state.mode === "menu" && pointInRect(p.x, p.y, ui.playerName)) {
      openNamePanel();
      return;
    }

    if (
      (state.mode === "menu" && pointInRect(p.x, p.y, ui.ranking)) ||
      (state.mode === "gameover" && pointInRect(p.x, p.y, ui.rankingGameOver))
    ) {
      state.showRanking = true;
      return;
    }

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

nameInput.addEventListener("input", () => {
  state.pendingPlayerName = nameInput.value.replace(/\s+/g, " ").slice(0, 12);
  if (nameInput.value !== state.pendingPlayerName) {
    nameInput.value = state.pendingPlayerName;
  }
});

window.addEventListener("resize", updateNameInputPosition);

function waitImage(image) {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    image.onload = resolve;
  });
}

Promise.all([
  waitImage(sprites),
  waitImage(configSprites),
  waitImage(scoreSprites),
  waitImage(shopSprites),
  waitImage(logoImage),
  waitImage(parrotRed),
  waitImage(parrotYellow),
  waitImage(coinGold),
  waitImage(mapa)
]).then(() => {
  state.mode = "menu";
});

raf = requestAnimationFrame(loop);
