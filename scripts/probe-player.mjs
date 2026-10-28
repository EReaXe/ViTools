import { Player, Platform } from '../extension/vendor/youtubei.js';
import '../extension/video-decipher.js';
const response = await fetch('https://www.youtube.com/iframe_api', { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`iframe_api: HTTP ${response.status}`);
const source = await response.text();
const id = source.match(/player\\\/([^\\]+)\\\//)?.[1];
if (!id) throw new Error('Oynatıcı sürümü bulunamadı.');
const player = await Player.create(undefined, fetch, undefined, id);
console.log('Oynatıcı sürümü:', id, 'Çıkarılan işlevler:', player.data?.exported?.join(', '));
if (!player.data?.exported?.includes('nsigFunction')) throw new Error('n/sig işlevi çıkarılamadı.');
const interpret = Platform.shim.eval;
const url = 'https://test.googlevideo.com/videoplayback?n=abcdefghijk&c=WEB';
// Only the Node diagnostic uses native execution to compare against the interpreter.
// The extension always uses its packaged AST interpreter.
Platform.shim.eval = data => new Function(data.output)();
const expected = await player.decipher(url);
Platform.shim.eval = interpret;
const actual = await player.decipher(url);
if (actual !== expected) throw new Error('Yorumlayıcı sonucu referansla eşleşmedi.');
console.log('Güncel oynatıcı n dönüşümü yorumlayıcı ve referans sonuçları eşleşti.');
