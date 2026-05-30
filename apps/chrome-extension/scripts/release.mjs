import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  throw new Error('npm_execpath is not available in this environment.');
}

const run = (args) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [npmExecPath, ...args], {
      cwd: appRoot,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Command failed: ${args.join(' ')}`));
    });
  });

await run(['run', 'test', '--', '--run']);
await run(['run', 'build']);
await run(['run', 'release:validate']);
await run(['run', 'package:zip']);
