import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['api', 'components', 'lib', 'screens', 'services', 'src', 'tests'];
const problems = [];

async function walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    if (entry.isFile() && /\.(js|mjs)$/.test(entry.name)) {
      const text = await readFile(full, 'utf8');
      if (/\bdebugger\b/.test(text)) problems.push(`${full}: debugger statement`);
      if (/TODO:\s*$/.test(text)) problems.push(`${full}: empty TODO`);
    }
  }
}

await Promise.all(roots.map(walk));

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log('basic lint passed');
