// VELVET FOX — The Aldermere Gallery Heist.
//
// Every layout coordinate and tuning number for the heist, in one place. The playfield is a fixed
// 1280x720 logical area; render.js scales it to the window, so no rule below depends on the screen
// size. All art is drawn from these numbers — the game ships no image, audio or font files.

export const FIELD = { width: 1280, height: 720 };

/** Height of the opaque HUD band painted across the top of the screen. */
export const HUD_H = 64;

/** Fixed simulation step in seconds: sixty updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** The wall frame. The walkable floor is the frame inset by `wall` pixels on every side. */
export const ROOM = { x0: 18, y0: 64, x1: 1262, y1: 720, wall: 16 };
export const FLOOR = {
  x0: ROOM.x0 + ROOM.wall,
  y0: ROOM.y0 + ROOM.wall,
  x1: ROOM.x1 - ROOM.wall,
  y1: ROOM.y1 - ROOM.wall,
};

export const PALETTE = {
  night: '#070b16',
  floor: '#232733',
  floorSeam: '#2c3140',
  floorGrain: '#1c202b',
  wallStone: '#171d2c',
  wallStoneLine: '#212a3f',
  wallTop: '#2b3550',
  marble: '#d9deea',
  marbleVein: '#b9c0d2',
  rug: '#5e1c27',
  rugTrim: '#8c2c39',
  rugThread: '#a83a45',
  gold: '#e0b24a',
  goldDim: '#9c7a2e',
  brass: '#7d6330',
  coneWarm: '255,224,150',
  coneHot: '255,84,68',
  guardNavy: '#2b3f68',
  guardNavyDark: '#1e2c49',
  guardTrim: '#c6d2e8',
  guardCap: '#16203a',
  thiefCoat: '#16181f',
  thiefCoatEdge: '#2b2f3b',
  thiefCoatDark: '#0f1117',
  thiefScarf: '#cf2b36',
  thiefSkin: '#d9a988',
  diamond: '#a8f0ff',
  diamondCore: '#ffffff',
  diamondGlow: '#5fd8f7',
  panel: '#080d1a',
  panelLine: '#1d2740',
  text: '#f2f5fb',
  muted: '#8e9bb5',
  safe: '#63d68f',
  danger: '#ff5c4d',
  warn: '#ffc24b',
};

export const FONT = {
  ui: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

export const THIEF = {
  radius: 11,
  speed: 181,
  coins: 3,
  smokes: 2,
  smokeRadius: 80,
  smokeLife: 3.6,
};

export const GUARD = {
  radius: 13,
  fov: 1.14,
  range: 246,
  spotTime: 0.4,
  loseTime: 0.7,
  catchDist: 28,
  patrolSpeed: 86,
  lureSpeed: 102,
  chaseSpeed: 146,
  lookAround: 1.7,
};

export const CAMERA = {
  fov: 0.64,
  range: 640,
  spotTime: 0.26,
  loseTime: 0.42,
};

export const ALARM = {
  fillPerSpotter: 11.5,
  maxSpotters: 3,
  drain: 4.6,
  tripAt: 100,
};

export const COIN = {
  range: 470,
  flight: 0.58,
  lureRange: 350,
  lureTime: 4.8,
};

export const LOOT = {
  grabRadius: 78,
  grabTime: 1.05,
};

export const SCORE = {
  base: 10000,
  perSecond: 38,
  perAlarm: 16,
  coin: 350,
  smoke: 400,
  clean: 2000,
  floor: 600,
  loot: 1500,
};

/**
 * The gallery itself. Coordinates are in playfield pixels, y grows downward. `blocks` is the flat
 * collider and line-of-sight list every other module reads; the named sub-lists are the same
 * rectangles, kept apart so render.js can dress each kind differently.
 */
const pillarRect = (x, y) => ({ x, y, w: 46, h: 46, kind: 'pillar' });
const caseRect = (x, y, w, h) => ({ x, y, w, h, kind: 'case' });
const benchRect = (x, y) => ({ x, y, w: 150, h: 26, kind: 'bench' });
const postRect = (x, y) => ({ x, y, w: 13, h: 13, kind: 'post' });

const pillars = [pillarRect(150, 170), pillarRect(1084, 170), pillarRect(150, 530), pillarRect(1084, 530)];

const wallCases = [
  caseRect(330, 80, 64, 32),
  caseRect(608, 80, 64, 32),
  caseRect(886, 80, 64, 32),
  caseRect(330, 640, 64, 32),
  caseRect(608, 640, 64, 32),
  caseRect(886, 640, 64, 32),
  caseRect(34, 368, 34, 52),
  caseRect(1212, 368, 34, 52),
];

const lootCase = caseRect(590, 346, 100, 100);

const benches = [benchRect(300, 252), benchRect(830, 472)];

const ropePosts = [
  postRect(540, 296),
  postRect(634, 296),
  postRect(728, 296),
  postRect(540, 486),
  postRect(634, 486),
  postRect(728, 486),
  postRect(470, 372),
  postRect(790, 372),
];

export const LEVEL = {
  /** The thief enters through the service door in the lower left. */
  thiefStart: { x: 96, y: 652 },
  /** The gallery window the thief must climb out of once the diamond is in the bag. */
  exit: { x: 1044, y: 76, w: 146, h: 26 },
  /** The "Sun of Aldermere", set in the plinth at the centre of the hall. */
  loot: { x: 640, y: 396 },

  blocks: [...pillars, ...wallCases, lootCase, ...benches, ...ropePosts],
  pillars,
  wallCases,
  lootCase,
  benches,
  ropePosts,

  /** Where the velvet ropes strung between two posts run. */
  ropes: [
    { x0: 546, y0: 302, x1: 734, y1: 302 },
    { x0: 546, y0: 492, x1: 734, y1: 492 },
    { x0: 476, y0: 305, x1: 476, y1: 378 },
    { x0: 796, y0: 305, x1: 796, y1: 378 },
  ],

  /** The red runner across the hall and the runner that leads up to the plinth. */
  rugs: [
    { x: 150, y: 354, w: 1000, h: 84 },
    { x: 600, y: 96, w: 80, h: 608 },
  ],

  /** Gold-framed canvases hung on the wall band; painted, not blockers. */
  paintings: [
    { x: 200, y: 70, w: 104, h: 26, hue: '#5b3f7a' },
    { x: 460, y: 70, w: 104, h: 26, hue: '#2f5f63' },
    { x: 1010, y: 70, w: 96, h: 26, hue: '#6d4327' },
    { x: 210, y: 692, w: 104, h: 26, hue: '#31456e' },
    { x: 470, y: 692, w: 104, h: 26, hue: '#6b2f4a' },
    { x: 1000, y: 692, w: 110, h: 26, hue: '#4a5f34' },
    { x: 24, y: 250, w: 26, h: 96, hue: '#2f5f63' },
    { x: 1230, y: 250, w: 26, h: 96, hue: '#5b3f7a' },
  ],

  /** Wall sconces that throw warm pools of light onto the marble. */
  lamps: [
    { x: 236, y: 96 },
    { x: 744, y: 96 },
    { x: 1240, y: 220 },
    { x: 40, y: 470 },
    { x: 640, y: 700 },
    { x: 1120, y: 660 },
  ],

  /** Three patrols. Waypoints sit in open floor so a guard never needs to thread the furniture. */
  guards: [
    {
      name: 'Sergeant Ashe',
      start: { x: 214, y: 150 },
      facing: 0.9,
      patrol: [{ x: 214, y: 150 }, { x: 500, y: 150 }, { x: 500, y: 560 }, { x: 214, y: 560 }],
      phase: 0,
    },
    {
      name: 'Officer Marr',
      start: { x: 1046, y: 202 },
      facing: 3.14,
      patrol: [{ x: 1046, y: 202 }, { x: 780, y: 202 }, { x: 780, y: 560 }, { x: 1046, y: 560 }],
      phase: 0.34,
    },
    {
      name: 'Officer Voss',
      start: { x: 300, y: 690 },
      facing: 0,
      patrol: [{ x: 300, y: 690 }, { x: 980, y: 690 }, { x: 980, y: 600 }, { x: 300, y: 600 }],
      phase: 0.62,
    },
  ],

  /** Two wall cameras sweeping the hall. `sweep` is radians per second of swing. */
  cameras: [
    { name: 'CAM WEST', mount: { x: 78, y: 124 }, from: 0.02, to: 0.86, fov: 0.64, period: 13, phase: 0 },
    { name: 'CAM EAST', mount: { x: 1216, y: 652 }, from: 2.9, to: 3.62, fov: 0.64, period: 15, phase: 0.4 },
  ],
};
