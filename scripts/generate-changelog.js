#!/usr/bin/env node
/**
 * Generates public/changelog.json from git log.
 * Run before build (or dev) so the app can load /changelog.json.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'public', 'changelog.json');
const DELIM = '|||';
const MAX_ENTRIES = 50;

function escapeJson(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

let raw = '';
try {
  raw = execSync(
    `git log -${MAX_ENTRIES} --format="%h${DELIM}%s${DELIM}%ci${DELIM}%an"`,
    { cwd: root, encoding: 'utf-8', maxBuffer: 1024 * 1024 }
  );
} catch (e) {
  console.warn('generate-changelog: git log failed', e.message);
  raw = '';
}

const lines = raw ? raw.trim().split('\n') : [];
const entries = lines
  .map((line) => {
    const parts = line.split(DELIM);
    const hash = parts[0];
    const date = parts[parts.length - 2];
    const author = parts[parts.length - 1];
    const subject = parts.length > 3 ? parts.slice(1, -2).join(DELIM) : (parts[1] || '');
    if (!hash) return null;
    return {
      hash: escapeJson(hash),
      subject: escapeJson(subject),
      date: escapeJson(date || ''),
      author: escapeJson(author || ''),
    };
  })
  .filter(Boolean);

const payload = { generatedAt: new Date().toISOString(), entries };

mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log('Changelog written:', outPath, `(${entries.length} entries)`);
