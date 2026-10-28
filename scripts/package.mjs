import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'extension/manifest.json')));
const metadata = JSON.parse(readFileSync(join(root, 'package.json')));
if (metadata.version !== manifest.version) throw new Error('Sürüm numaraları eşleşmiyor.');
if (metadata.license !== 'MIT' || !readFileSync(join(root, 'LICENSE'), 'utf8').startsWith('MIT License')) throw new Error('Lisans doğrulanamadı.');
const checked = spawnSync(process.execPath, [join(root, 'scripts/test.mjs')], { stdio: 'inherit' });
if (checked.status !== 0) process.exit(checked.status || 1);
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(item => {
    if (item.isSymbolicLink()) throw new Error('Paket içinde sembolik bağlantı desteklenmiyor.');
    const path = join(directory, item.name);
    return item.isDirectory() ? files(path) : [path];
  });
}
const table = Array.from({ length: 256 }, (_, i) => {
  let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
});
function crc32(buffer) { let c = 0xffffffff; for (const byte of buffer) c = table[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function archive(entries) {
  const localParts = [], centralParts = []; let offset = 0;
  const seen = new Set();
  for (const [name, data] of entries) {
    if (seen.has(name) || name.startsWith('/') || name.split('/').includes('..')) throw new Error('Geçersiz paket yolu.');
    seen.add(name);
    const filename = Buffer.from(name); const compressed = deflateRawSync(data); const crc = crc32(data);
    // Verify every compressed entry before writing the release.
    const roundtrip = inflateRawSync(compressed);
    if (!roundtrip.equals(data) || crc32(roundtrip) !== crc) throw new Error('ZIP veri kontrolü başarısız.');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0x21, 12); local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
    localParts.push(local, filename, compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8); central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0x21, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42);
    centralParts.push(central, filename); offset += local.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(centralParts); const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, directory, end]);
}
const extensionRoot = join(root, 'extension');
const extensionEntries = files(extensionRoot).map(path => [relative(extensionRoot, path).replaceAll('\\', '/'), readFileSync(path)]);
for (const document of ['LICENSE', 'PRIVACY.md', 'CHANGELOG.md']) extensionEntries.push([document, readFileSync(join(root, document))]);
extensionEntries.push(['INSTALL.md', Buffer.from('# Kurulum\n\nZIP dosyasını bir klasöre çıkarın. Chrome’da chrome://extensions sayfasını açıp Geliştirici modunu etkinleştirin. Paketlenmemiş öğe yükle ile manifest.json dosyasının bulunduğu bu klasörü seçin. YouTube sayfasını yenileyin.\n\nSürüm 0.1.0 bir deneme sürümüdür. Kaynak kod paketi ayrıca sunulur. Mağaza yayını yapılmadı.\n')]);
const sourcePaths = [...files(extensionRoot), ...files(join(root, 'scripts')),
  ...['README.md', 'LICENSE', 'PRIVACY.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'PUBLISHING.md', 'package.json', '.gitignore'].map(name => join(root, name))];
const sourceEntries = sourcePaths.map(path => [relative(root, path).replaceAll('\\', '/'), readFileSync(path)]);
const output = resolve(root, 'dist'); mkdirSync(output, { recursive: true });
const sums = [];
for (const [suffix, entries] of [['chrome', extensionEntries], ['source', sourceEntries]]) {
  const path = join(output, `${metadata.name}-${manifest.version}-${suffix}.zip`); const bytes = archive(entries);
  writeFileSync(path, bytes); sums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${basename(path)}`);
  console.log(`${basename(path)}: ${entries.length} dosya, ${(bytes.length / 1048576).toFixed(2)} MB`);
}
writeFileSync(join(output, 'SHA256SUMS.txt'), sums.join('\n') + '\n');
