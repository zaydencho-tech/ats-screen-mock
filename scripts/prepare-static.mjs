import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import screens from '../src/demo/screens.json' with { type: 'json' };

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
// Direct screen links also work on static hosts without the local Node server.
for (const { slug } of screens) {
  const directory = path.join(dist, 'screens', slug);
  await mkdir(directory, { recursive: true });
  await copyFile(path.join(dist, 'index.html'), path.join(directory, 'index.html'));
}
console.log(`Prepared ${screens.length} static screen routes.`);
