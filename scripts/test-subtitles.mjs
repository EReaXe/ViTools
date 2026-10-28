import assert from 'node:assert/strict';
import '../extension/subtitles.js';
const data = { events: [
  { tStartMs: 0, dDurationMs: 10 },
  { tStartMs: 3599999, dDurationMs: 1501, segs: [{ utf8: 'Türkçe ' }, { utf8: '<örnek> & metin' }] },
  { tStartMs: 50, dDurationMs: 10, segs: [{ utf8: '\n' }] }
] };
const srt = globalThis.formatSubtitles(data, 'srt');
assert.equal(srt, '1\n00:59:59,999 --> 01:00:01,500\nTürkçe &lt;örnek&gt; &amp; metin\n');
const vtt = globalThis.formatSubtitles(data, 'vtt');
assert.ok(vtt.startsWith('WEBVTT\n\n1\n00:59:59.999 --> 01:00:01.500'));
assert.throws(() => globalThis.formatSubtitles({ events: [] }, 'srt'), /metni alınamadı/);
console.log('Altyazı zaman damgası, Türkçe metin, işaret kaçışları ve boş yanıt kontrolleri geçti.');
