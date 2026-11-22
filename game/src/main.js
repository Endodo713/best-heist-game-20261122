// VELVET FOX — game loop. Ties input, world, thief, guards, cameras, alarm, audio and renderer
// together into one fixed-step simulation with title / playing / caught / won states.

import { FIELD, STEP, LOOT, SCORE, GUARD } from './config.js';
import { createInput } from './input.js';
import { insideFloor } from './world.js';
import { createGuards, resetGuards, updateGuards, coneIsHot as guardHot } from './guards.js';
import { createCameras, resetCameras, updateCameras, coneIsHot as camHot } from './cameras.js';
import { createAlarm, updateAlarm, resetAlarm } from './alarm.js';
import { createThief, resetThief, updateThief, throwCoin, useSmoke, startGrab, cancelGrab } from './thief.js';
import * as sounds from './audio.js';
import {
  bindCanvas, resize, getCtx, drawGuard, drawCamera, drawLoot, drawThief, drawCoin,
  drawHUD, drawTitle, drawEnd,
} from './render.js';

const canvas = document.getElementById('game');
bindCanvas(canvas);
window.addEventListener('resize', () => resize(canvas.width, canvas.height));

const input = createInput(canvas, FIELD);

let level = null;
let thief = null;
let guards = null;
let cameras = null;
let alarm = null;
let coins = null;
let smoke = null;

let time = 0;
let score = 0;
let state = 'title'; // title | playing | caught | won
let secondsPlayed = 0;
let lastTime = performance.now();

let frameId = null;

function startGame() {
  import('./config.js').then((cfg) => {
    level = cfg.LEVEL;
    thief = createThief(level);
    guards = createGuards(level, 0);
    cameras = createCameras(level, 0);
    alarm = createAlarm();
    coins = [];
    smoke = { x: 0, y: 0, life: 0, alpha: 0 };
    score = 0;
    secondsPlayed = 0;
    time = 0;
    state = 'playing';
    lastTime = performance.now();
    requestFrame();
  });
}

function restart() {
  resetThief(thief, level);
  resetGuards(guards);
  resetCameras(cameras);
  resetAlarm(alarm);
  coins = [];
  smoke.life = 0;
  score = 0;
  secondsPlayed = 0;
  time = 0;
  state = 'playing';
  lastTime = performance.now();
  requestFrame();
}

function endCaught() {
  state = 'caught';
  sounds.sounds.caught();
  cancelAnimationFrame(frameId);
  frameId = null;
}

function endWon() {
  state = 'won';
  sounds.sounds.win();
  cancelAnimationFrame(frameId);
  frameId = null;
}

function releaseGrab() {
  if (!thief.grabbing) return;
  const held = thief.grabTimer >= LOOT.grabTime;
  cancelGrab(thief);
  if (held) {
    thief.loot = true;
    score += SCORE.loot;
    sounds.sounds.loot();
  }
}

function updateCoins(dt) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vy += 900 * dt;
    c.angle += dt * 8;
    c.life -= dt;
    if (c.life <= 0) {
      sounds.sounds.coinClink();
      let best = null;
      let bestDist = 500;
      for (let g = 0; g < guards.length; g++) {
        const dist = Math.hypot(guards[g].x - c.x, guards[g].y - c.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = guards[g];
        }
      }
      if (best) {
        best.state = 'lure';
        best.lure = { x: c.x, y: c.y };
        best.lookTimer = 0;
      }
      coins.splice(i, 1);
    }
  }
}

function updateSmoke(dt) {
  if (thief.smokeTimer > 0) {
    thief.smokeTimer -= dt;
    if (thief.smokeTimer < 0) thief.smokeTimer = 0;
  }
  if (smoke.life > 0) {
    smoke.life -= dt;
    smoke.alpha = Math.min(1, smoke.life / 2);
    if (smoke.life <= 0) smoke.alpha = 0;
  }
}

function requestFrame() {
  frameId = requestAnimationFrame((t) => {
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    update(dt);
    draw();
    if (state === 'playing') requestFrame();
  });
}

function update(dt) {
  time += dt;
  secondsPlayed += dt;

  const clicks = input.takeClicks();
  for (let i = 0; i < clicks.length; i++) {
    const { x, y } = clicks[i];
    throwCoin(thief, x, y, {});
  }
  if (input.tapped('Space')) {
    useSmoke(thief);
  }

  updateThief(thief, input, dt);
  updateCoins(dt);
  updateSmoke(dt);

  const smoky = thief.smokeTimer > 0;

  const { spotters: gSpotters } = updateGuards(guards, thief, alarm, dt, time, {});
  const cSpotters = updateCameras(cameras, thief, time, dt);
  const spotters = gSpotters + cSpotters;

  updateAlarm(alarm, spotters, dt);

  // Loot grab: hold E while standing on the plinth.
  if (!thief.loot) {
    const d = Math.hypot(thief.x - level.loot.x, thief.y - level.loot.y);
    if (d < LOOT.grabRadius && input.isDown('KeyE')) {
      if (!thief.grabbing) startGrab(thief);
    } else {
      releaseGrab();
    }
  } else {
    const d = Math.hypot(thief.x - level.exit.x, thief.y - level.exit.y);
    if (d < 40) {
      endWon();
      return;
    }
  }

  // Catch: any guard touching the thief while not tripped/already dead.
  if (!thief.dead) {
    for (let i = 0; i < guards.length; i++) {
      const g = guards[i];
      const d = Math.hypot(g.x - thief.x, g.y - thief.y);
      if (d < GUARD.catchDist + thief.radius) {
        thief.dead = true;
        endCaught();
        return;
      }
    }
  }

  score += SCORE.perSecond * dt;
}

function drawFloor(c) {
  c.fillStyle = '#232733';
  c.fillRect(0, 64, 1280, 720);
  // seams
  c.strokeStyle = '#2c3140';
  c.lineWidth = 1;
  for (let x = 18; x <= 1262; x += 96) { c.beginPath(); c.moveTo(x, 64); c.lineTo(x, 720); c.stroke(); }
  for (let y = 64; y <= 720; y += 96) { c.beginPath(); c.moveTo(18, y); c.lineTo(1262, y); c.stroke(); }
}

function drawLamps(c) {
  for (const l of level.lamps) {
    const g = c.createRadialGradient(l.x, l.y, 4, l.x, l.y, 150);
    g.addColorStop(0, 'rgba(255,220,150,0.3)');
    g.addColorStop(0.5, 'rgba(255,220,150,0.05)');
    g.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(l.x, l.y, 150, 0, Math.PI * 2); c.fill();
  }
}

function drawRugs(c) {
  c.fillStyle = '#5e1c27';
  c.strokeStyle = '#8c2c39';
  c.lineWidth = 3;
  for (const r of level.rugs) {
    c.fillRect(r.x, r.y, r.w, r.h);
    c.strokeRect(r.x, r.y, r.w, r.h);
  }
}

function drawRopes(c) {
  c.strokeStyle = '#a83a45';
  c.lineWidth = 3;
  for (const r of level.ropes) {
    c.beginPath(); c.moveTo(r.x0, r.y0); c.lineTo(r.x1, r.y1); c.stroke();
  }
}

function drawCases(c) {
  c.fillStyle = '#d9deea';
  c.strokeStyle = '#b9c0d2';
  c.lineWidth = 1.5;
  for (const b of level.wallCases) {
    c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeRect(b.x, b.y, b.w, b.h);
  }
  const l = level.lootCase;
  c.fillRect(l.x, l.y, l.w, l.h);
  c.strokeRect(l.x, l.y, l.w, l.h);
}

function drawPillars(c) {
  c.fillStyle = '#d9deea';
  c.strokeStyle = '#b9c0d2';
  c.lineWidth = 1.5;
  for (const b of level.pillars) {
    c.beginPath(); c.roundRect(b.x, b.y, b.w, b.h, 8); c.fill(); c.stroke();
  }
}

function drawPaintings(c) {
  c.strokeStyle = '#e0b24a';
  c.lineWidth = 2.5;
  for (const p of level.paintings) {
    c.fillStyle = p.hue;
    c.fillRect(p.x, p.y, p.w, p.h);
    c.strokeRect(p.x, p.y, p.w, p.h);
  }
}

function drawExit(c) {
  const e = level.exit;
  c.fillStyle = '#101626';
  c.fillRect(e.x, e.y, e.w, e.h);
  c.strokeStyle = '#e0b24a';
  c.lineWidth = 3;
  c.strokeRect(e.x, e.y, e.w, e.h);
  c.fillStyle = '#e0b24a';
  c.font = 'bold 14px system-ui';
  c.textAlign = 'center';
  c.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
}

function draw() {
  // Title screen: nothing else is initialised yet, so draw only the title.
  if (state === 'title') {
    drawTitle();
    return;
  }

  const c = getCtx();

  drawFloor(c);
  drawLamps(c);

  drawRugs(c);
  drawRopes(c);
  drawCases(c);
  drawPillars(c);
  drawPaintings(c);
  drawExit(c);

  for (let i = 0; i < guards.length; i++) drawGuard(guards[i], guardHot(guards[i]));
  for (let i = 0; i < cameras.length; i++) drawCamera(cameras[i], camHot(cameras[i]));

  drawLoot(level.loot.x, level.loot.y, time, thief.loot);

  if (smoke.alpha > 0) {
    c.save();
    c.globalAlpha = smoke.alpha;
    c.fillStyle = '#c8c8d2';
    c.beginPath(); c.arc(thief.x, thief.y, 80, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  drawThief(thief, smokyAlpha());

  for (let i = 0; i < coins.length; i++) drawCoin(coins[i]);

  drawHUD(alarm, thief, level, score, stateText(), stateColour(), state);
  if (state === 'title') drawTitle();
  if (state === 'caught') drawEnd('CAUGHT!', `the guards took ${Math.round(secondsPlayed)}s to find you`, Math.round(score), 'press R or click RESTART');
  if (state === 'won') drawEnd('CLEAN GETAWAY', `escaped with the Sun of Aldermere in ${Math.round(secondsPlayed)}s`, Math.round(score), 'press R or click RESTART');
}

function smokyAlpha() {
  return thief.smokeTimer > 0 ? 0.5 : 0;
}

function stateText() {
  if (state === 'caught') return 'CAUGHT!';
  if (state === 'won') return 'CLEAN GETAWAY';
  return null;
}

function stateColour() {
  if (state === 'caught') return '#ff5c4d';
  if (state === 'won') return '#63d68f';
  return null;
}

  // Draw once at load so the title screen is visible immediately instead of a blank canvas.
  draw();

// Deterministic screenshot staging hook for the build session (dev only).
window.__vfox = {
  state() { return state; },
  thief() { return { x: thief.x, y: thief.y }; },
  guards() { return guards.map(g => ({ x: g.x, y: g.y, angle: g.angle })); },
  cameras() { return cameras.map(c => ({ x: c.mount.x, y: c.mount.y, angle: c.angle })); },
  alarm() { return { value: alarm.value, tripped: alarm.tripped }; },
  setThief(x, y) { if (thief) { thief.x = x; thief.y = y; } },
  setAlarm(v) { if (alarm) { alarm.value = Math.min(100, Math.max(0, v)); alarm.tripped = v >= 100; } },
  forceLoot() { if (thief) { thief.loot = true; } },
  forceWon() { endWon(); },
  forceCaught() { endCaught(); },
  start() { if (state === 'title') startGame(); },
  restart() { if (state !== 'playing') restart(); },
};

canvas.addEventListener('mousedown', (e) => {
  if (state === 'title') { startGame(); return; }
  if (state === 'caught' || state === 'won') { restart(); return; }
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' || e.code === 'Enter') {
    e.preventDefault();
    if (state === 'title') startGame();
    else if (state === 'caught' || state === 'won') restart();
  }
});
