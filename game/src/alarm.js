// The alarm meter. It fills while any guard or camera holds the thief in its eye, drains while the
// thief is hidden, and trips at full. Once tripped the guards converge on the last place they saw
// the thief, and a single touch ends the heist.

import { ALARM } from './config.js';

export function createAlarm() {
  return {
    value: 0,
    tripped: false,
    history: 0,
  };
}

export function updateAlarm(alarm, spotters, dt) {
  alarm.history = Math.max(alarm.history, alarm.value);
  if (alarm.tripped) return;
  if (spotters > 0) {
    const rate = ALARM.fillPerSpotter * Math.min(spotters, ALARM.maxSpotters);
    alarm.value = Math.min(ALARM.tripAt, alarm.value + rate * dt);
    if (alarm.value >= ALARM.tripAt) alarm.tripped = true;
  } else {
    alarm.value = Math.max(0, alarm.value - ALARM.drain * dt);
  }
}

export function resetAlarm(alarm) {
  alarm.value = 0;
  alarm.tripped = false;
  alarm.history = 0;
}
