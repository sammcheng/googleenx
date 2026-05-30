import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const distRoot = resolve(appRoot, 'dist');
const artifactsRoot = resolve(appRoot, 'artifacts');
const packageName = 'food-delivery-price-comparison-extension.zip';
const zipPath = resolve(artifactsRoot, packageName);

if (!existsSync(distRoot)) {
  throw new Error('dist/ was not found. Run the build first.');
}

await mkdir(artifactsRoot, { recursive: true });
await rm(zipPath, { force: true });

await execFileAsync('zip', ['-rq', zipPath, '.'], {
  cwd: distRoot,
});

console.log(`Created ${zipPath}`);
