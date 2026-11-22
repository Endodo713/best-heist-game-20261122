// main.ts — hands VELVET FOX in to the make.fun scorer.
//
// Copies game/ and screenshots/ beside this file into the output dir (MAKEFUN_OUTPUT_DIR, else
// /output) and writes dossier.json with buildDossier from vendor/makefun-game.ts. Two runs must
// produce identical bytes. Everything here is the Node 22 standard library; nothing touches the
// network and nothing launches a browser.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

function copyRecursive(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(from, to);
    else cpSync(from, to, { recursive: false, preserveTimestamps: true });
  }
}

copyRecursive(join(here, 'game'), join(out, 'game'));
if (existsSync(join(here, 'screenshots'))) {
  copyRecursive(join(here, 'screenshots'), join(out, 'screenshots'));
}

// The scorer's own caps (gate.json): only text_max_bytes shapes the dossier bytes; the others
// refuse an entry the scorer would refuse, so we pass them too.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('dossier written to', join(out, 'dossier.json'));
