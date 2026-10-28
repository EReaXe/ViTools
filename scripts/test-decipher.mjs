import assert from 'node:assert/strict';
import { Platform } from '../extension/vendor/youtubei.js';
import { decipherVideo } from '../extension/video-decipher.js';
const result = await Platform.shim.eval({ output: 'class Transform { run(value) { return value.split("").reverse().join(""); } } return { n: new Transform().run("abc123") };' });
assert.equal(result.n, '321cba');
await assert.rejects(() => decipherVideo({ playerId: '../invalid' }), /sürümü bulunamadı/);
console.log('Yerel yorumlayıcı: class sözdizimi, dönüşüm sonucu ve oynatıcı kimliği kontrolleri geçti.');
