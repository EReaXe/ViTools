import assert from 'node:assert/strict';
import { readAdaptiveVideo, fetchAdaptiveStreams } from '../extension/adaptive.js';
const videoId = 'abcdefghijk';
const item = (itag, mimeType, extra = {}) => ({ itag, mimeType, url: `https://test.googlevideo.com/videoplayback?itag=${itag}`, ...extra });
globalThis.document = {
  scripts: [{ src: 'https://www.youtube.com/s/player/fixture/player_ias.vflset/en_US/base.js' }],
  getElementById: () => ({ getPlayerResponse: () => ({ videoDetails: { videoId, title: 'Fixture' }, streamingData: { adaptiveFormats: [
    item(137, 'video/mp4; codecs="avc1.640028"', { height: 1080, fps: 30, qualityLabel: '1080p', contentLength: '200' }),
    item(140, 'audio/mp4; codecs="mp4a.40.2"', { bitrate: 128000, contentLength: '100' }),
    item(999, 'audio/mp4; codecs="mp4a.40.2"', { bitrate: 256000, audioTrack: { audioIsDefault: false } }),
    item(313, 'video/webm; codecs="vp9"', { height: 2160, qualityLabel: '2160p' }),
    item(251, 'audio/webm; codecs="opus"', { bitrate: 160000 }),
    item(998, 'video/mp4; codecs="avc1.640028"', { drmFamilies: ['widevine'], height: 4320 })
  ] } }) })
};
const formats = readAdaptiveVideo(videoId).formats;
assert.equal(formats.length, 2); assert.equal(formats[0].quality, '2160p');
assert.equal(formats.find(f => f.index === 137).size, 300);
assert.equal(readAdaptiveVideo(videoId, 137).audio.url.includes('itag=140'), true);
assert.equal(readAdaptiveVideo(videoId, null, true).video, null);
assert.ok(readAdaptiveVideo(videoId, null, true).audio.url.includes('itag=140'));
assert.ok(readAdaptiveVideo('wrong').error); assert.ok(readAdaptiveVideo(videoId, 998).error);
const savedDocument = globalThis.document;
globalThis.document = { ...savedDocument, getElementById: () => ({ getPlayerResponse: () => ({ videoDetails: { videoId }, streamingData: { adaptiveFormats: [] } }) }) };
globalThis.ytInitialPlayerResponse = { videoDetails: { videoId }, streamingData: { adaptiveFormats: [
  item(137, 'video/mp4; codecs="avc1.640028"', { height: 1080, qualityLabel: '1080p' }),
  item(140, 'audio/mp4; codecs="mp4a.40.2"', { audioTrack: { id: 'en.0', displayName: 'English' } })
] } };
assert.equal(readAdaptiveVideo(videoId).formats[0].quality, '1080p', 'Başlangıç yanıtı ve varsayılan etiketi olmayan ses desteklenmeli.');
globalThis.ytInitialPlayerResponse.videoDetails.videoId = 'oldvideo123';
assert.equal(readAdaptiveVideo(videoId).formats.length, 0, 'Önceki videonun yanıtı kullanılmamalı.');
assert.ok(readAdaptiveVideo(videoId).warning);
delete globalThis.ytInitialPlayerResponse; globalThis.document = savedDocument;
globalThis.document = { ...savedDocument, getElementById: () => ({ getPlayerResponse: () => ({
  videoDetails: { videoId, title: 'SABR fixture' },
  streamingData: { serverAbrStreamingUrl: 'https://test.googlevideo.com/videoplayback?sabr=1', adaptiveFormats: [
    { itag: 137, mimeType: 'video/mp4; codecs="avc1.640028"', height: 1080, qualityLabel: '1080p', lastModified: '100', bitrate: 1000000 },
    { itag: 140, mimeType: 'audio/mp4; codecs="mp4a.40.2"', lastModified: '200', bitrate: 128000 }
  ] }, playerConfig: { mediaCommonConfig: { mediaUstreamerRequestConfig: { videoPlaybackUstreamerConfig: 'fixture' } } }
}) }) };
assert.equal(readAdaptiveVideo(videoId).formats[0].quality, '1080p', 'URL olmayan SABR biçimleri listelenmeli.');
const sabr = readAdaptiveVideo(videoId, 137).sabr;
assert.equal(sabr.videoItag, 137); assert.equal(sabr.audioItag, 140);
assert.equal(sabr.videoPlaybackUstreamerConfig, 'fixture');
const audioSabr = readAdaptiveVideo(videoId, null, true).sabr;
assert.equal(audioSabr.audioOnly, true); assert.equal(audioSabr.formats.length, 1);
assert.equal(audioSabr.videoItag, null); assert.equal(audioSabr.audioItag, 140);
globalThis.document = savedDocument;
globalThis.location = { href: `https://www.youtube.com/watch?v=${videoId}`, origin: 'https://www.youtube.com' };
const address = 'https://test.googlevideo.com/videoplayback';
globalThis.fetch = async () => new Response('Forbidden', { status: 403 });
assert.match((await fetchAdaptiveStreams(videoId, address, address, 'fixture')).error, /403/);
globalThis.fetch = async () => new Response('not video', { headers: { 'content-type': 'text/plain' } });
assert.match((await fetchAdaptiveStreams(videoId, address, address, 'fixture')).error, /geçerli/);
globalThis.fetch = async () => new Response(new Uint8Array(12), { status: 206, headers: { 'content-type': 'video/mp4', 'content-range': 'bytes 0-11/100' } });
assert.match((await fetchAdaptiveStreams(videoId, address, address, 'fixture')).error, /geçerli/);
console.log('Yüksek kalite seçimi, varsayılan ses, DRM filtresi, 403/metin ve eksik dosya kontrolleri geçti.');
