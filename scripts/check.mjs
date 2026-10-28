import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url)));
if (manifest.manifest_version !== 3) throw new Error('Manifest V3 gerekli');
for (const file of readdirSync(new URL('../extension/', import.meta.url)).filter(f => f.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', new URL(`../extension/${file}`, import.meta.url).pathname.replace(/^\/(\w:)/, '$1')], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
}
console.log('Manifest ve JavaScript sözdizimi kontrolleri başarılı.');
