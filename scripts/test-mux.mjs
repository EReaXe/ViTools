import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { muxVideoAudio } from '../extension/mux.js';
import { Input, BlobSource, ALL_FORMATS, Output, BufferTarget, Mp4OutputFormat, WebMOutputFormat,
  EncodedVideoPacketSource, EncodedAudioPacketSource, EncodedPacketSink } from '../extension/vendor/mediabunny.mjs';
const filename = process.argv[2];
const extension = process.argv[3] === 'webm' ? 'webm' : 'mp4';
if (!filename) throw new Error('Sesli MP4 test dosyasının yolunu belirt.');
const input = new Input({ source: new BlobSource(new Blob([readFileSync(filename)])), formats: ALL_FORMATS });
const video = await input.getPrimaryVideoTrack(); const audio = await input.getPrimaryAudioTrack();
assert.ok(video && audio, 'Test dosyasında görüntü ve ses bulunmalı.');
async function separate(track, isVideo) {
  const target = new BufferTarget(); const output = new Output({ target, format: extension === 'webm' ? new WebMOutputFormat() : new Mp4OutputFormat() });
  const source = isVideo ? new EncodedVideoPacketSource(await track.getCodec()) : new EncodedAudioPacketSource(await track.getCodec());
  if (isVideo) output.addVideoTrack(source); else output.addAudioTrack(source);
  await output.start(); let first = true;
  for await (const packet of new EncodedPacketSink(track).packets()) {
    await source.add(packet, first ? { decoderConfig: await track.getDecoderConfig() } : undefined); first = false;
  }
  source.close(); await output.finalize(); return new Blob([target.buffer], { type: isVideo ? 'video/mp4' : 'audio/mp4' });
}
const videoBlob = await separate(video, true); const audioBlob = await separate(audio, false);
const merged = await muxVideoAudio(videoBlob, audioBlob, extension);
const result = new Input({ source: new BlobSource(merged), formats: ALL_FORMATS });
const outputVideo = await result.getPrimaryVideoTrack(); const outputAudio = await result.getPrimaryAudioTrack();
assert.ok(outputVideo && outputAudio);
assert.equal(await outputVideo.getDisplayWidth(), await video.getDisplayWidth());
assert.equal(await outputVideo.getDisplayHeight(), await video.getDisplayHeight());
async function packets(track) { const all = []; for await (const packet of new EncodedPacketSink(track).packets()) all.push(packet); return all; }
for (const [original, output] of [[video, outputVideo], [audio, outputAudio]]) {
  const before = await packets(original); const after = await packets(output);
  assert.equal(after.length, before.length);
  for (let i = 0; i < before.length; i++) {
    assert.deepEqual(after[i].data, before[i].data, 'Kodlanmış paket içeriği değişmemeli.');
    assert.ok(Math.abs(after[i].timestamp - before[i].timestamp) < 0.002, 'Zaman damgası korunmalı.');
  }
}
await assert.rejects(() => muxVideoAudio(new Blob(['not video']), audioBlob, 'mp4'));
console.log(`Gerçek ${extension.toUpperCase()}: ayrı görüntü/ses birleştirildi; iki kanal, çözünürlük, tüm paketler ve zaman damgaları doğrulandı. Bozuk girdi reddedildi.`);
input.dispose(); result.dispose();
