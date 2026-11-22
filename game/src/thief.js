// The Velvet Fox: movement, the coin toss, the smoke puff, and the loot grab.

import { THIEF, LEVEL } from './config.js';
import { slideMove, insideFloor, clampToFloor } from './world.js';

export function createThief(level) {
  return {
    x: level.thiefStart.x,
    y: level.thiefStart.y,
    radius: THIEF.radius,
    angle: 0,
    speed: THIEF.speed,
    coinsLeft: THIEF.coins,
    smokesLeft: THIEF.smokes,
    smokeTimer: 0,
    loot: false,
    grabbing: false,
    grabTimer: 0,
    dir: { x: 0, y: 0 },
    dead: false,
  };
}

export function resetThief(thief, level) {
  const start = level.thiefStart;
  thief.x = start.x;
  thief.y = start.y;
  thief.angle = 0;
  thief.coinsLeft = THIEF.coins;
  thief.smokesLeft = THIEF.smokes;
  thief.smokeTimer = 0;
  thief.loot = false;
  thief.grabbing = false;
  thief.grabTimer = 0;
  thief.dead = false;
}

export function updateThief(thief, input, dt) {
  const { x: ax, y: ay } = input.axis();
  thief.dir.x = ax;
  thief.dir.y = ay;
  thief.angle = Math.atan2(ay, ax);

  if (ax !== 0 || ay !== 0) {
    const step = thief.speed * dt;
    slideMove(thief, ax * step, ay * step, thief.radius);
    thief.x = clampToFloor(thief.x, thief.y, thief.radius + 1).x;
    thief.y = clampToFloor(thief.x, thief.y, thief.radius + 1).y;
  }

  thief.x = clampToFloor(thief.x, thief.y, thief.radius).x;
  thief.y = clampToFloor(thief.x, thief.y, thief.radius).y;

  if (thief.smokeTimer > 0) {
    thief.smokeTimer -= dt;
    if (thief.smokeTimer < 0) thief.smokeTimer = 0;
  }

  if (thief.grabbing) {
    thief.grabTimer += dt;
  }

  return { x: ax, y: ay };
}

export function throwCoin(thief, fieldX, fieldY, hooks) {
  if (thief.coinsLeft <= 0) return null;
  thief.coinsLeft--;
  const vx = fieldX - thief.x;
  const vy = fieldY - thief.y;
  const len = Math.hypot(vx, vy) || 1;
  const coin = {
    x: thief.x,
    y: thief.y,
    vx: (vx / len) * 620,
    vy: (vy / len) * 620,
    life: THIEF.smokeLife,
    angle: 0,
  };
  return coin;
}

export function useSmoke(thief) {
  if (thief.smokesLeft <= 0 || thief.smokeTimer > 0) return false;
  thief.smokesLeft--;
  thief.smokeTimer = THIEF.smokeLife;
  return true;
}

export function startGrab(thief) {
  if (thief.grabbing) return false;
  thief.grabbing = true;
  thief.grabTimer = 0;
  return true;
}

export function cancelGrab(thief) {
  thief.grabbing = false;
  thief.grabTimer = 0;
}
