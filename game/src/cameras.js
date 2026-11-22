// The two wall-mounted cameras. Each hangs on its mount and sweeps a cone back and forth; the cone
// turns red while the camera holds the thief in its eye, and the alarm climbs for as long as it does.

import { CAMERA, GUARD } from './config.js';
import { seesPoint } from './world.js';

export function createCameras(level, phaseOffset) {
  return level.cameras.map((spec) => ({
    name: spec.name,
    mount: { x: spec.mount.x, y: spec.mount.y },
    angle: spec.from,
    from: spec.from,
    to: spec.to,
    period: spec.period,
    phase: spec.phase + phaseOffset,
    fov: spec.fov,
    suspicion: 0,
    spottedFor: 0,
    sweepDir: 1,
  }));
}

export function resetCameras(cameras) {
  for (let i = 0; i < cameras.length; i++) {
    const c = cameras[i];
    c.angle = c.from;
    c.suspicion = 0;
    c.spottedFor = 0;
    c.sweepDir = 1;
  }
}

export function coneIsHot(c) {
  return c.suspicion >= 1 || c.spottedFor > 0;
}

export function updateCameras(cameras, thief, time, dt) {
  let spotters = 0;
  const smoky = thief.smokeTimer > 0;

  for (let i = 0; i < cameras.length; i++) {
    const c = cameras[i];
    const span = c.to - c.from;
    const mid = c.from + span * 0.5;
    const t = (time / c.period + c.phase) % 1;
    // Smooth ping-pong: eases at each end so the sweep feels mechanical.
    const wave = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
    c.angle = c.from + span * wave;

    const canSee = smoky
      ? false
      : seesPoint(c.mount.x, c.mount.y, c.angle, c.fov / 2, CAMERA.range, thief.x, thief.y);

    if (canSee) {
      c.suspicion = Math.min(1, c.suspicion + dt / CAMERA.spotTime);
      c.spottedFor = CAMERA.loseTime;
    } else {
      c.suspicion = Math.max(0, c.suspicion - dt / 0.2);
      c.spottedFor = Math.max(0, c.spottedFor - dt);
    }
    if (coneIsHot(c)) spotters++;
  }
  return spotters;
}
