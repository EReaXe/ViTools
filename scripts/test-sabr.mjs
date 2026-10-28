import assert from 'node:assert/strict';
import { VideoPlaybackAbrRequest, buildSabrFormat } from '../extension/vendor/googlevideo.mjs';
import { downloadSabr } from '../extension/sabr.js';
const token = Uint8Array.of(1, 2, 3, 4);
const request = VideoPlaybackAbrRequest.decode(new Uint8Array());
request.streamerContext = { clientInfo: { clientName: 1, clientVersion: 'fixture' }, poToken: token, sabrContexts: [], unsentSabrContexts: [] };
const bytes = VideoPlaybackAbrRequest.encode(request).finish();
const context = VideoPlaybackAbrRequest.decode(bytes).streamerContext;
assert.deepEqual(context.poToken, token); assert.equal(context.clientInfo.clientVersion, 'fixture');
const format = buildSabrFormat({ itag: 137, mimeType: 'video/mp4; codecs="avc1.640028"',
  lastModified: '1000', bitrate: 1000000, approxDurationMs: '10000', width: 1920, height: 1080, qualityLabel: '1080p' });
assert.equal(format.hasVideo, true); assert.equal(format.hasAudio, false); assert.equal(format.lastModified, '1000');
await assert.rejects(() => downloadSabr({ serverAbrStreamingUrl: 'https://example.com/videoplayback' }, 'abcdefghijk'), /geçersiz/);
console.log('SABR: oynatıcı doğrulama bilgisini okuma, URL olmayan format dönüşümü ve kaynak doğrulaması geçti.');
