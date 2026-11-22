// All drawing for VELVET FOX. One canvas, fixed 1280x720 logical space, scaled to the window. Every
// colour, glow and line here is computed — no images, no web fonts, nothing loaded over the network.

import { PALETTE, FONT, HUD_H, GUARD, CAMERA, THIEF } from './config.js';
import { rayRange } from './world.js';

let ctx;
export function getCtx(){ return ctx; }
let scaleX = 1;
let scaleY = 1;
let width = 1280;
let height = 720;

export function bindCanvas(canvas) {
  ctx = canvas.getContext('2d', { alpha: false });
  resize(canvas.width, canvas.height);
}

export function resize(w, h) {
  width = w;
  height = h;
  scaleX = width / 1280;
  scaleY = height / 720;
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
}

const P = (v) => v; // logical pixel, scaled by the transform above

const now = () => performance.now();

function pathCircle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

function fillCircle(x, y, r, colour) {
  ctx.fillStyle = colour;
  pathCircle(x, y, r);
  ctx.fill();
}

function strokeCircle(x, y, r, colour, widthPx = 2) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = widthPx;
  pathCircle(x, y, r);
  ctx.stroke();
}

function line(x0, y0, x1, y1, colour, widthPx = 2) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = widthPx;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function rect(x, y, w, h, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w, h);
}

function strokeRect(x, y, w, h, colour, widthPx = 2) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = widthPx;
  ctx.strokeRect(x, y, w, h);
}

function text(str, x, y, { size = 20, colour = PALETTE.text, font = FONT.ui, align = 'center', weight = 'bold', baseline = 'middle' } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = colour;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Glowing text outline for the HUD header. */
function glowText(str, x, y, size, colour) {
  ctx.save();
  ctx.font = `bold ${size}px ${FONT.ui}`;
  ctx.fillStyle = colour;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = colour;
  ctx.shadowBlur = 14;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** A soft radial light pool from a wall sconce. */
function lightPool(x, y, radius, intensity) {
  const grad = ctx.createRadialGradient(x, y, 4, x, y, radius);
  grad.addColorStop(0, `rgba(255,220,150,${intensity * 0.35})`);
  grad.addColorStop(0.45, `rgba(255,220,150,${intensity * 0.08})`);
  grad.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** A vision cone: centre line angle, half field of view, range, clipped by furniture via world.js. */
export function drawCone(ex, ey, angle, halfFov, range, blockedFn, colour, hot) {
  const left = angle - halfFov;
  const right = angle + halfFov;
  const step = halfFov / 24;
  const fan = [];

  for (let t = 0; t <= 48; t++) {
    const a = left + step * t;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const maxT = blockedFn(ex, ey, ux, uy, range);
    fan.push({ x: ex + ux * maxT, y: ey + uy * maxT });
  }

  ctx.save();
  ctx.globalAlpha = hot ? 0.42 : 0.14;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  for (let t = 0; t < fan.length; t++) {
    ctx.lineTo(fan[t].x, fan[t].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // The centre ray and rim edges, brighter when hot.
  const rux = Math.cos(angle);
  const ruy = Math.sin(angle);
  const rc = blockedFn(ex, ey, rux, ruy, range);
  line(ex, ey, ex + rux * rc, ey + ruy * rc, hot ? colour : rgba(colour, 0.5), hot ? 3 : 1.5);
  line(ex, ey, fan[0].x, fan[0].y, rgba(colour, hot ? 0.8 : 0.35), hot ? 3 : 1.5);
  line(ex, ey, fan[fan.length - 1].x, fan[fan.length - 1].y, rgba(colour, hot ? 0.8 : 0.35), hot ? 3 : 1.5);
}

function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Draw one guard: coat, cap, scarf trim, and their red eye cone. */
export function drawGuard(g, hot) {
  const facing = g.angle;
  const dir = { x: Math.cos(facing), y: Math.sin(facing) };

  // Vision cone in world coords (before the body translate).
  drawCone(g.x, g.y, facing, GUARD.fov / 2, GUARD.range, (ex,ey,ux,uy,maxT)=>rayRange(ex,ey,ux,uy,maxT), PALETTE.coneWarm, hot);

  ctx.save();
  ctx.translate(g.x, g.y);

  // Body: navy coat.
  ctx.fillStyle = PALETTE.guardNavy;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(10, 10);
  ctx.lineTo(8, -14);
  ctx.lineTo(-8, -14);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = PALETTE.guardNavyDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(10, 10);
  ctx.lineTo(8, -14);
  ctx.lineTo(-8, -14);
  ctx.closePath();
  ctx.stroke();

  // Head + cap.
  fillCircle(0, -18, 7, PALETTE.guardCap);
  rect(-7, -25, 14, 7, PALETTE.guardNavyDark);
  rect(-8, -26, 16, 3, PALETTE.guardTrim);

  // Scarf trim at the neck.
  rect(-5, 4, 10, 5, PALETTE.guardTrim);

  // Eyes in facing direction.
  fillCircle(dir.x * 3, dir.y * 3 - 18, 2, '#ffffff');

  ctx.restore();
}

/** Draw one camera: bracket on the wall plus its sweeping cone. */
export function drawCamera(c, hot) {
  const { x: mx, y: my } = c.mount;
  const facing = c.angle;

  drawCone(mx, my, facing, CAMERA.fov / 2, CAMERA.range, (ex,ey,ux,uy,maxT)=>rayRange(ex,ey,ux,uy,maxT), PALETTE.coneWarm, hot);

  // Mount bracket.
  rect(mx - 10, my - 6, 20, 12, PALETTE.wallStone);
  rect(mx - 4, my - 10, 8, 4, PALETTE.brass);
  fillCircle(mx, my - 4, 5, '#2b3550');
  rect(mx - 2, my - 8, 4, 4, PALETTE.gold);

  // Small lens dot facing along the cone.
  const lx = mx + Math.cos(facing) * 5;
  const ly = my + Math.sin(facing) * 5;
  fillCircle(lx, ly, 2.5, hot ? PALETTE.danger : PALETTE.muted);
}

/** Draw the diamond on its plinth, with a little glow pulse. */
export function drawLoot(x, y, t, taken) {
  if (taken) return;
  const glow = 10 + Math.sin(t * 4) * 6;
  fillCircle(x, y, glow, `rgba(95,216,247,0.25)`);
  fillCircle(x, y, glow * 0.5, `rgba(95,216,247,0.12)`);
  // Plinth.
  rect(x - 16, y + 12, 32, 10, PALETTE.marble);
  strokeRect(x - 16, y + 12, 32, 10, PALETTE.marbleVein, 1.5);
  // Diamond facets.
  ctx.fillStyle = PALETTE.diamond;
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x - 10, y - 4);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x + 10, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.diamondCore;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x - 5, y - 2);
  ctx.lineTo(x, y + 3);
  ctx.lineTo(x + 5, y - 2);
  ctx.closePath();
  ctx.fill();
  // Sparkle.
  const s = Math.sin(t * 8) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255,255,255,${0.6 + s * 0.4})`;
  ctx.fillRect(x - 2, y - 10, 4, 4);
}

/** Draw the thief: dark coat, red scarf, hood up. */
export function drawThief(thief, smokeAlpha) {
  ctx.save();
  ctx.translate(thief.x, thief.y);

  if (smokeAlpha > 0) {
    ctx.fillStyle = `rgba(200,200,210,${smokeAlpha * 0.55})`;
    pathCircle(0, 0, THIEF.smokeRadius);
    ctx.fill();
  }

  // Coat.
  ctx.fillStyle = PALETTE.thiefCoat;
  ctx.beginPath();
  ctx.moveTo(-9, 9);
  ctx.lineTo(9, 9);
  ctx.lineTo(7, -12);
  ctx.lineTo(-7, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefCoatEdge;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Scarf.
  ctx.fillStyle = PALETTE.thiefScarf;
  rect(-5, -2, 10, 8, PALETTE.thiefScarf);
  rect(-6, 5, 12, 4, PALETTE.thiefScarf);

  // Head / hood.
  fillCircle(0, -15, 6, PALETTE.thiefCoat);
  rect(-6, -21, 12, 6, PALETTE.thiefCoatDark);
  fillCircle(0, -16, 2, PALETTE.thiefSkin);

  ctx.restore();
}

/** A coin mid-arc or resting on the floor. */
export function drawCoin(coin) {
  ctx.save();
  ctx.translate(coin.x, coin.y);
  ctx.rotate(coin.angle);
  ctx.fillStyle = PALETTE.gold;
  pathCircle(0, 0, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.stroke();
  ctx.restore();
}

/** HUD bar: alarm meter top-left, tools top-right, status centre. */
export function drawHUD(alarm, thief, level, score, statusText, statusColour, state) {
  // Top band.
  rect(0, 0, 1280, HUD_H, PALETTE.panel);
  line(0, HUD_H, 1280, HUD_H, PALETTE.panelLine, 2);

  // Alarm meter.
  const barX = 150;
  const barW = 340;
  const barH = 14;
  const pct = alarm.value / 100;
  rect(barX, 24, barW, barH, '#101626');
  strokeRect(barX, 24, barW, barH, PALETTE.panelLine, 1.5);
  if (alarm.value > 0) {
    const fillW = barW * pct;
    const grad = ctx.createLinearGradient(barX, 24, barX + fillW, 24);
    grad.addColorStop(0, PALETTE.safe);
    grad.addColorStop(pct > 0.6 ? 0.6 : 1, PALETTE.warn);
    grad.addColorStop(1, PALETTE.danger);
    ctx.fillStyle = grad;
    ctx.fillRect(barX, 24, fillW, barH);
    if (alarm.tripped) {
      ctx.fillStyle = 'rgba(255,92,77,0.35)';
      ctx.fillRect(barX, 24, barW, barH);
    }
  }
  text('ALARM', barX - 55, 31, { size: 16, colour: PALETTE.muted, align: 'right', weight: '600' });
  text(`${Math.round(alarm.value)}%`, barX + barW + 12, 31, { size: 16, colour: alarm.tripped ? PALETTE.danger : PALETTE.text, weight: '700' });

  // Tools.
  const toolX = 1130;
  text(`coins ${thief.coinsLeft}`, toolX - 10, 31, { size: 14, colour: PALETTE.muted, align: 'right' });
  text(`smoke ${thief.smokesLeft}`, toolX - 10, 50, { size: 14, colour: PALETTE.muted, align: 'right' });

  // Loot state banner.
  if (thief.loot) {
    glowText('LOOT SECURED — reach the window', 640, 30, 22, PALETTE.gold);
  } else {
    glowText("VELVET FOX — the Aldermere gallery heist", 640, 30, 20, PALETTE.text);
  }

  // Status line (caught / won).
  if (statusText && state !== 'caught' && state !== 'won') {
    text(statusText, 640, 380, { size: 34, colour: statusColour, weight: '800' });
    text('press R or click RESTART', 640, 420, { size: 18, colour: PALETTE.muted });
  }

  // Hint line at the bottom.
  text('WASD/arrows move · click throws a coin · shift/space smoke', 640, 704, { size: 14, colour: PALETTE.muted });
}

/** Title screen. */
export function drawTitle() {
  rect(0, 0, 1280, 720, PALETTE.night);
  glowText('VELVET FOX', 640, 290, 56, PALETTE.gold);
  text('The Aldermere Gallery Heist', 640, 338, { size: 22, colour: PALETTE.muted });
  text('steal the Sun of Aldermere, then escape through the window', 640, 366, { size: 16, colour: PALETTE.muted });
  text('WASD / arrows · click throws a coin · hold shift for smoke', 640, 420, { size: 16, colour: PALETTE.text });
  text('click to begin', 640, 560, { size: 20, colour: PALETTE.safe, weight: '800' });
}

/** Win / lose overlay. */
export function drawEnd(title, subtitle, score, restartHint) {
  rect(0, 0, 1280, 720, 'rgba(7,11,22,0.82)');
  glowText(title, 640, 300, 48, title === 'CLEAN GETAWAY' ? PALETTE.safe : PALETTE.danger);
  text(subtitle, 640, 352, { size: 20, colour: PALETTE.text });
  text(`score  ${score}`, 640, 392, { size: 22, colour: PALETTE.gold, weight: '800' });
  text(restartHint, 640, 450, { size: 18, colour: PALETTE.muted });
}
