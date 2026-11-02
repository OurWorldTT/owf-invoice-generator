import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'core.js', 'config.js', 'api-client.js']) {
  await cp(resolve(root, file), resolve(output, file));
}
console.log(`Built public mobile web bundle at ${output}`);
