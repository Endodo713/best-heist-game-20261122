// The three patrols of the Aldermere gallery. Each guard walks a waypoint loop, swings a cone of
// sight in front of them, and builds up suspicion when the thief stands in it: the cone turns red
// while the guard is sure, and the alarm climbs for as long as it stays red.

import { GUARD, THIEF } from './config.js';
import { slideMove, seesPoint } from './world.js';

export function createGuards(level, phaseOffset) {
  return level.guards.map((spec) => ({
    name: spec.name,
    x: spec.start.x,
    y: spec.start.y,
    radius: GUARD.radius,
    angle: spec.facing,
    patrol: spec.patrol,
    wp: 0,
    state: 'patrol',
    lure: null,
    lookTimer: 0,
    lookBase: 0,
    suspicion: 0,
    spottedFor: 0,
    lastSeen: { x: spec.start.x, y: spec.start.y },
    stuck: 0,
    phase: spec.phase + phaseOffset,
    stepTimer: 0,
    facingSpeed: 4.6,
  }));
}

export function resetGuards(guards) {
  for (let i = 0; i < guards.length; i++) {
    const g = guards[i];
    const start = g.patrol[0];
    g.x = start.x;
    g.y = start.y;
    g.wp = 0;
    g.state = 'patrol';
    g.lure = null;
    g.lookTimer = 0;
    g.suspicion = 0;
    g.spottedFor = 0;
    g.lastSeen = { x: start.x, y: start.y };
    g.stuck = 0;
  }
}

/** Point a guard's lure at the coin: the nearest one within hearing takes the walk. */
export function lureNearestGuard(guards, x, y, range) {
  let best = null;
  let bestDist = range;
  for (let i = 0; i < guards.length; i++) {
    const g = guards[i];
    if (g.state === 'chase') continue;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  if (best) {
    best.state = 'lure';
    best.lure = { x, y };
    best.lookTimer = 0;
  }
  return best;
}

function isSpotted(g) {
  return g.suspicion >= 1 || g.spottedFor > 0;
}

/** The cone is red while the guard is sure of the thief, and for a moment after they lose them. */
export function coneIsHot(g) {
  return isSpotted(g);
}

function arriveTurn(g, target, speed, dt) {
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const dist = Math.hypot(dx, dy);
  const want = Math.atan2(dy, dx);
  const rate = g.facingSpeed * dt;
  let delta = want - g.angle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  g.angle += Math.max(-rate, Math.min(rate, delta));
  if (dist <= 1) return dist;
  const step = Math.min(dist, speed * dt);
  const moved = slideMove(g, (dx / dist) * step, (dy / dist) * step, g.radius);
  if (moved < speed * dt * 0.35) g.stuck += dt;
  else g.stuck = 0;
  return dist;
}

export function updateGuards(guards, thief, alarm, dt, time) {
  let spotters = 0;
  let nearestDist = Infinity;
  const smoky = thief.smokeTimer > 0;

  for (let i = 0; i < guards.length; i++) {
    const g = guards[i];
    const tripped = alarm.tripped;
    const speed = tripped ? GUARD.chaseSpeed : g.state === 'lure' ? GUARD.lureSpeed : GUARD.patrolSpeed;

    // --- what the guard is doing with their feet -------------------------------
    if (tripped) {
      g.state = 'chase';
      arriveTurn(g, g.lastSeen, speed, dt);
    } else if (g.state === 'lure') {
      const left = arriveTurn(g, g.lure, speed, dt);
      if (left <= 16) {
        g.lookTimer += dt;
        const swing = (g.lookTimer / GUARD.lookAround) * Math.PI * 1.5;
        g.angle = g.lookBase + Math.sin(swing) * 0.95;
        if (g.lookTimer >= GUARD.lookAround) {
          g.state = 'patrol';
          g.lure = null;
        }
      }
    } else {
      const target = g.patrol[g.wp];
      const left = arriveTurn(g, target, speed, dt);
      if (left <= 12 || g.stuck > 1.4) {
        g.stuck = 0;
        g.wp = (g.wp + 1) % g.patrol.length;
      }
    }

    // --- what the guard is doing with their eyes ------------------------------
    const canSee = smoky ? false : seesPoint(g.x, g.y, g.angle, GUARD.fov / 2, GUARD.range, thief.x, thief.y);
    if (canSee) {
      g.suspicion = Math.min(1, g.suspicion + dt / GUARD.spotTime);
      g.spottedFor = GUARD.loseTime;
      g.lastSeen = { x: thief.x, y: thief.y };
    } else {
      g.suspicion = Math.max(0, g.suspicion - dt / 0.22);
      g.spottedFor = Math.max(0, g.spottedFor - dt);
    }
    if (isSpotted(g)) spotters++;

    const dist = Math.hypot(g.x - thief.x, g.y - thief.y);
    if (dist < nearestDist) nearestDist = dist;

  }

  return { spotters, nearestDist };
}
