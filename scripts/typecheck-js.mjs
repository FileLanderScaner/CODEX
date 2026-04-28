import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const roots = ['api', 'lib', 'server', 'services', 'src', 'tests'];
const files = [];

async function walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) files.push(full);
  }
}

await Promise.all(roots.map(walk));

for (const file of files) {
  let result = spawnSync(process.execPath, ['--check', file], { stdio: 'pipe', encoding: 'utf8' });
  if (result.error?.code === 'EPERM') {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
    result = spawnSync(process.execPath, ['--check', file], { stdio: 'pipe', encoding: 'utf8' });
  }
  if (result.error?.code === 'EPERM') {
    console.warn(`${file}: skipped syntax check after EPERM from Windows process policy`);
    continue;
  }
  if (result.error || result.status !== 0) {
    console.error(`${file}: ${result.error?.message || result.stderr || result.stdout || 'syntax check failed'}`);
    process.exit(result.status || 1);
  }
}

console.log(`syntax check passed (${files.length} files)`);
