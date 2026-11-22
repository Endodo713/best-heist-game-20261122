// All sound is synthesised in WebAudio at runtime: no audio files anywhere in game/. The context
// starts on the first player click so every modern browser lets it run.

let ctx;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function tone(duration, frequency, type = 'square', volume = 0.06, when = null) {
  const c = ensure();
  if (!c) return;
  const start = when == null ? c.currentTime : when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(start);
  osc.stop(start + duration);
}

function noise(duration, volume = 0.05, when = null) {
  const c = ensure();
  if (!c) return;
  const start = when == null ? c.currentTime : when;
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  src.connect(gain);
  gain.connect(c.destination);
  src.start(start);
  src.stop(start + duration);
}

export const sounds = {
  /** Footstep while walking — soft click, pitch changes with speed. */
  step() { tone(0.03, 220, 'square', 0.025); },
  /** The coin arcs through the air and clinks on the marble. */
  coinClink() {
    tone(0.12, 880, 'sine', 0.07);
    tone(0.12, 1175, 'sine', 0.05, ensure ? ensure().currentTime + 0.04 : 0);
    noise(0.06, 0.04);
  },
  /** Smoke puff — short burst of brown noise. */
  smoke() { noise(0.35, 0.07); },
  /** The alarm starts beeping once tripped. */
  alarmBeep() { tone(0.15, 330, 'square', 0.09); },
  /** Camera spots the thief — a sharp electronic ping. */
  spot() { tone(0.1, 780, 'square', 0.09); },
  /** Guard spots — lower, meaner ping. */
  guardSpot() { tone(0.12, 520, 'square', 0.09); },
  /** Loot taken — a bright rising chime. */
  loot() {
    for (let i = 0; i < 4; i++) {
      tone(0.25, 880 * Math.pow(1.25, i), 'sine', 0.05, ensure ? ensure().currentTime + i * 0.06 : i * 0.06);
    }
  },
  /** Heist complete — a short triumphant fanfare. */
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone(0.22, f, 'sine', 0.06, ensure ? ensure().currentTime + i * 0.09 : i * 0.09));
  },
  /** Caught — a low descending buzz. */
  caught() {
    for (let i = 0; i < 4; i++) {
      tone(0.35, 180 / (1 + i * 0.25), 'sawtooth', 0.07, ensure ? ensure().currentTime + i * 0.07 : i * 0.07);
    }
  },
};

export function clickToStart() {
  ensure();
}
