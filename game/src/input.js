// Keyboard and mouse, polled by the game loop. Everything is a Set or a small queue so the loop
// never reads from the DOM more than once a frame.

const MOVE_KEYS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export function createInput(canvas, field) {
  const down = new Set();
  const tapped = new Set();
  const clicks = [];

  const toField = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * field.width,
      y: ((clientY - rect.top) / rect.height) * field.height,
    };
  };

  const onKeyDown = (e) => {
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    if (MOVE_KEYS[e.code] || e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
    }
    if (!down.has(e.code)) tapped.add(e.code);
    down.add(e.code);
  };

  const onKeyUp = (e) => down.delete(e.code);

  const onBlur = () => {
    down.clear();
    clicks.length = 0;
  };

  const onClick = (e) => {
    e.preventDefault();
    clicks.push(toField(e.clientX, e.clientY));
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onClick);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const held = (codes) => codes.some((code) => down.has(code));

  return {
    /** The movement vector, normalised. */
    axis() {
      let x = 0;
      let y = 0;
      if (down.has('KeyA') || down.has('ArrowLeft')) x -= 1;
      if (down.has('KeyD') || down.has('ArrowRight')) x += 1;
      if (down.has('KeyW') || down.has('ArrowUp')) y -= 1;
      if (down.has('KeyS') || down.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const scale = 1 / Math.hypot(x, y);
        x *= scale;
        y *= scale;
      }
      return { x, y };
    },

    isMoving() {
      return this.axis().x !== 0 || this.axis().y !== 0;
    },

    /** True once per physical press, consumed by whoever asks first. */
    tapped(code) {
      if (!tapped.has(code)) return false;
      tapped.delete(code);
      return true;
    },

    isDown(code) {
      return down.has(code);
    },

    isSmokeHeld() {
      return held(['Space', 'ShiftLeft', 'ShiftRight']);
    },

    /** Clicks since the last frame, in playfield coordinates, oldest first. */
    takeClicks() {
      if (clicks.length === 0) return [];
      const out = clicks.splice(0, clicks.length);
      return out;
    },
  };
}
