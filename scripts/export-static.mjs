import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Static route entries let shared screen/state URLs load without a Node server.
const root = new URL('../', import.meta.url);
const html = await readFile(new URL('dist/index.html', root), 'utf8');
const screens = JSON.parse(await readFile(new URL('src/demo/screens.json', root), 'utf8'));
for (const screen of screens) {
  const directory = new URL(`dist/screens/${screen.slug}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}
await writeFile(new URL('dist/404.html', root), html);
await writeFile(new URL('dist/.nojekyll', root), '');
console.log(`Exported ${screens.length} screen URLs to ${fileURLToPath(new URL('dist/', root))}`);
