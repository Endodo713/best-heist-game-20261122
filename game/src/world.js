// The gallery floor as geometry: colliders, line-of-sight tests and the little movement helpers the
// thief, guards and cameras all share. Everything is axis-aligned rectangles, so the maths here stays
// cheap enough to run sixty times a second alongside the vision cones.

import { FLOOR, LEVEL } from './config.js';

const BLOCKS = LEVEL.blocks;

export function circleHitsBlock(cx, cy, r, block) {
  const nx = Math.max(block.x, Math.min(cx, block.x + block.w));
  const ny = Math.max(block.y, Math.min(cy, block.y + block.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

/** True when a circle at (cx, cy) would sit inside a block or past the wall. */
export function isStandingOnBlock(cx, cy, r) {
  if (cx - r < FLOOR.x0 || cx + r > FLOOR.x1 || cy - r < FLOOR.y0 || cy + r > FLOOR.y1) return true;
  for (let i = 0; i < BLOCKS.length; i++) {
    if (circleHitsBlock(cx, cy, r, BLOCKS[i])) return true;
  }
  return false;
}

/**
 * Slide a circle by (dx, dy) against the furniture and the wall. Axis-aligned sliding means an agent
 * walking along a wall hugs it instead of getting stuck, which keeps patrols from jamming.
 */
export function slideMove(pos, dx, dy, r) {
  let moved = 0;
  if (dx !== 0 && !isStandingOnBlock(pos.x + dx, pos.y, r)) {
    pos.x += dx;
    moved = Math.abs(dx);
  }
  if (dy !== 0 && !isStandingOnBlock(pos.x, pos.y + dy, r)) {
    pos.y += dy;
    moved = Math.max(moved, Math.abs(dy));
  }
  return moved;
}

/**
 * Smallest t in [0, maxT] where the ray from (x0, y0) along (dx, dy) enters the block, or -1 when it
 * never does. The slab test used by every cone and every sight-line in the game.
 */
function rayIntoBlock(x0, y0, dx, dy, maxT, block) {
  let tmin = 0;
  let tmax = maxT;
  if (Math.abs(dx) < 1e-9) {
    if (x0 < block.x || x0 > block.x + block.w) return -1;
  } else {
    let a = (block.x - x0) / dx;
    let b = (block.x + block.w - x0) / dx;
    if (a > b) {
      const swap = a;
      a = b;
      b = swap;
    }
    if (a > tmin) tmin = a;
    if (b < tmax) tmax = b;
    if (tmin > tmax) return -1;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y0 < block.y || y0 > block.y + block.h) return -1;
  } else {
    let a = (block.y - y0) / dy;
    let b = (block.y + block.h - y0) / dy;
    if (a > b) {
      const swap = a;
      a = b;
      b = swap;
    }
    if (a > tmin) tmin = a;
    if (b < tmax) tmax = b;
    if (tmin > tmax) return -1;
  }
  return tmin;
}

/**
 * Is the straight line from (x0, y0) to (x1, y1) cut by the furniture? A detector only sees the thief
 * when this comes back false.
 */
export function lineBlocked(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return false;
  const ux = dx / len;
  const uy = dy / len;
  for (let i = 0; i < BLOCKS.length; i++) {
    if (rayIntoBlock(x0, y0, ux, uy, len, BLOCKS[i]) >= 0) return true;
  }
  return false;
}

/**
 * How far a ray from (x0, y0) along (ux, uy) reaches before hitting the furniture, capped at maxT.
 * Used to carve the vision cones so a cone never spills through a pillar or a display case.
 */
export function rayRange(x0, y0, ux, uy, maxT) {
  let best = maxT;
  for (let i = 0; i < BLOCKS.length; i++) {
    const t = rayIntoBlock(x0, y0, ux, uy, best, BLOCKS[i]);
    if (t >= 0 && t < best) best = t;
  }
  return best;
}

/** Is the point inside any collider, used to place coins and smoke puffs sensibly. */
export function pointInBlock(x, y) {
  for (let i = 0; i < BLOCKS.length; i++) {
    const b = BLOCKS[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

export function insideFloor(x, y) {
  return x >= FLOOR.x0 && x <= FLOOR.x1 && y >= FLOOR.y0 && y <= FLOOR.y1;
}

export function clampToFloor(x, y, margin) {
  return {
    x: Math.max(FLOOR.x0 + margin, Math.min(FLOOR.x1 - margin, x)),
    y: Math.max(FLOOR.y0 + margin, Math.min(FLOOR.y1 - margin, y)),
  };
}

/** An angle difference folded into (-PI, PI]. */
export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/**
 * Can a detector standing at (ex, ey), facing `angle` with a half field of view of `halfFov` and a
 * range of `range`, see the point (tx, ty)? Field of view and range first, then the furniture: a
 * guard never sees through a display case. A target within a few pixels of the detector counts as
 * seen no matter which way it faces.
 */
export function seesPoint(ex, ey, angle, halfFov, range, tx, ty) {
  const dx = tx - ex;
  const dy = ty - ey;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 24 && Math.abs(angleDelta(Math.atan2(dy, dx), angle)) > halfFov) return false;
  return !lineBlocked(ex, ey, tx, ty);
}
