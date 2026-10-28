import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const checks = ['check.mjs', 'test-subtitles.mjs', 'test-decipher.mjs', 'test-adaptive.mjs', 'test-media-url.mjs', 'test-sabr.mjs', 'test-mp3.mjs', 'test-updates.mjs'];
for (const check of checks) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(check, import.meta.url))], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Tüm yerel kontroller geçti.');
