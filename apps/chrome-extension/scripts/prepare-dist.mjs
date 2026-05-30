import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const distRoot = resolve(appRoot, 'dist');
const apiBaseUrl = (process.env.VITE_API_BASE_URL || 'https://api.foodpricecomparison.com').replace(/\/$/, '');
const apiOrigin = new URL(apiBaseUrl).origin;

await mkdir(resolve(distRoot, 'icons'), { recursive: true });
await mkdir(resolve(distRoot, 'popup'), { recursive: true });
await mkdir(resolve(distRoot, 'options'), { recursive: true });
await mkdir(resolve(distRoot, 'content'), { recursive: true });

const manifestSource = await readFile(resolve(appRoot, 'manifest.json'), 'utf8');
const manifest = JSON.parse(manifestSource);

manifest.host_permissions = Array.from(
  new Set(
    (manifest.host_permissions || []).map((permission) =>
      permission === 'https://api.foodpricecomparison.com/*' ? `${apiOrigin}/*` : permission,
    ),
  ),
);

if (manifest.content_security_policy?.extension_pages) {
  manifest.content_security_policy.extension_pages = manifest.content_security_policy.extension_pages.replace(
    /connect-src 'self' [^;]+;/,
    `connect-src 'self' ${apiOrigin};`,
  );
}

await writeFile(resolve(distRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await cp(resolve(appRoot, 'icons'), resolve(distRoot, 'icons'), { recursive: true });
await cp(resolve(distRoot, 'src/popup/index.html'), resolve(distRoot, 'popup/index.html'));
await cp(resolve(distRoot, 'src/options/index.html'), resolve(distRoot, 'options/index.html'));
await cp(resolve(appRoot, 'src/content/content.css'), resolve(distRoot, 'content/content.css'));
