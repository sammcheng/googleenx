import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');
const distManifestPath = resolve(appRoot, 'dist/manifest.json');
const apiBaseUrl = process.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL must be set for a production release.');
}

let parsedApiUrl;
try {
  parsedApiUrl = new URL(apiBaseUrl);
} catch {
  throw new Error(`VITE_API_BASE_URL is not a valid URL: ${apiBaseUrl}`);
}

if (parsedApiUrl.protocol !== 'https:') {
  throw new Error('VITE_API_BASE_URL must use https for a production release.');
}

if (['localhost', '127.0.0.1'].includes(parsedApiUrl.hostname) || parsedApiUrl.hostname.endsWith('.local')) {
  throw new Error('VITE_API_BASE_URL must point to a public production host, not localhost.');
}

if (parsedApiUrl.origin === 'https://api.foodpricecomparison.com') {
  throw new Error('VITE_API_BASE_URL is still set to the placeholder API origin.');
}

const manifest = JSON.parse(await readFile(distManifestPath, 'utf8'));
const expectedPermission = `${parsedApiUrl.origin}/*`;
const permissions = manifest.host_permissions || [];
const csp = manifest.content_security_policy?.extension_pages || '';

if (!permissions.includes(expectedPermission)) {
  throw new Error(`dist/manifest.json is missing host permission for ${expectedPermission}`);
}

if (permissions.includes('https://api.foodpricecomparison.com/*')) {
  throw new Error('dist/manifest.json still contains the placeholder API host permission.');
}

if (!csp.includes(parsedApiUrl.origin)) {
  throw new Error(`dist/manifest.json CSP is missing connect-src for ${parsedApiUrl.origin}`);
}

if (csp.includes('https://api.foodpricecomparison.com')) {
  throw new Error('dist/manifest.json CSP still contains the placeholder API origin.');
}

console.log(`Release validation passed for ${parsedApiUrl.origin}`);
