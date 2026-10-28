import { decipherVideo } from '../extension/video-decipher.js';
import { readAdaptiveVideo } from '../extension/adaptive.js';
const videoId = process.argv[2];
if (!/^[\w-]{11}$/.test(videoId || '')) throw new Error('Video kimliği gerekli.');
const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { signal: AbortSignal.timeout(20000) });
const html = await response.text();
const marker = 'var ytInitialPlayerResponse = ';
const start = html.indexOf(marker);
if (start < 0) throw new Error('Oynatıcı yanıtı bulunamadı.');
const rest = html.slice(start + marker.length);
let depth = 0, quoted = false, escaped = false, end = 0;
for (let i = 0; i < rest.length; i++) {
  const c = rest[i];
  if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
  else if (c === '"') quoted = true;
  else if (c === '{') depth++;
  else if (c === '}' && --depth === 0) { end = i + 1; break; }
}
const player = JSON.parse(rest.slice(0, end));
const formats = player.streamingData?.formats || [];
console.log('Oynatılabilirlik:', player.playabilityStatus?.status, 'Birleşik biçim sayısı:', formats.length);
const format = formats.find(f => f.url || f.signatureCipher || f.cipher);
const playerId = html.match(/\/s\/player\/([^/]+)\/[^" ]*base\.js/)?.[1];
if (!format) {
  globalThis.document = { scripts: [{ src: `https://www.youtube.com/s/player/${playerId}/player_ias.vflset/en_US/base.js` }], getElementById: () => ({ getPlayerResponse: () => player }) };
  const adaptive = readAdaptiveVideo(videoId);
  console.log('Yeni motorun okuyabildiği kaliteler:', adaptive.formats?.map(f => `${f.extension}/${f.quality}`).join(', ') || adaptive.warning || adaptive.error);
  const selected = adaptive.formats?.[0];
  if (!selected) process.exitCode = 1;
  else {
    const metadata = readAdaptiveVideo(videoId, selected.index);
    console.log('SABR yayın bilgileri:', Boolean(metadata.sabr), 'Görüntü/ses seçimleri:', metadata.sabr?.videoItag, metadata.sabr?.audioItag);
  }
  process.exit();
}
const url = await decipherVideo({ ...format, playerId });
const media = await fetch(url, { headers: { Range: 'bytes=0-15' }, signal: AbortSignal.timeout(20000) });
console.log('Çözümlenen medya yanıtı:', media.status, 'Tür:', media.headers.get('content-type'));
await media.body?.cancel();
if (!media.ok) process.exitCode = 1;
