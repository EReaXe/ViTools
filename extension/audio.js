import { Input, BlobSource, ALL_FORMATS, AudioSampleSink } from './vendor/mediabunny.mjs';
import lamejs from './vendor/lamejs.js';

export function parseAudioTime(text) {
  const value = String(text).trim();
  if (!/^\d+(?::[0-5]\d){0,2}(?:\.\d{1,3})?$/.test(value)) throw new Error('Zamanı SS:DD:ss biçiminde gir.');
  return value.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}
export async function encodeMp3(blob, { start = 0, end, bitrate = 128, onProgress = () => {}, isCurrent = () => true } = {}) {
  if (![128, 192, 256, 320].includes(bitrate)) throw new Error('Geçersiz MP3 bit hızı.');
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) throw new Error('Bitiş zamanı başlangıçtan büyük olmalı.');
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  try {
    const track = await input.getPrimaryAudioTrack();
    if (!track) throw new Error('Ses kanalı bulunamadı.');
    if (!(await track.canDecode())) throw new Error('Tarayıcı bu ses biçimini çözemiyor. Güncel Chrome ile tekrar dene.');
    const duration = await track.computeDuration();
    if (start >= duration || end > duration + 0.25) throw new Error('Seçilen zaman aralığı ses süresinin dışında.');
    const stop = Math.min(end, duration);
    let encoder, sampleRate, channels, frames = 0, lastYield = performance.now();
    const chunks = [];
    for await (const sample of new AudioSampleSink(track).samples(start, stop)) {
      try {
        if (!isCurrent()) throw new Error('Video veya sekme değiştiği için dönüşüm durduruldu.');
        if (!encoder) {
          sampleRate = sample.sampleRate; channels = sample.numberOfChannels;
          if (channels < 1 || channels > 2) throw new Error('Şimdilik yalnızca mono ve stereo ses destekleniyor.');
          encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
        }
        if (sample.sampleRate !== sampleRate || sample.numberOfChannels !== channels) throw new Error('Ses biçimi işlem sırasında değişti.');
        const from = Math.max(0, Math.ceil((start - sample.timestamp) * sampleRate - 0.00001));
        const to = Math.min(sample.numberOfFrames, Math.floor((stop - sample.timestamp) * sampleRate + 0.00001));
        if (to <= from) continue;
        const planes = [];
        for (let channel = 0; channel < channels; channel++) {
          const data = new Float32Array(to - from);
          sample.copyTo(data, { planeIndex: channel, format: 'f32-planar', frameOffset: from, frameCount: to - from });
          const pcm = new Int16Array(data.length);
          for (let i = 0; i < data.length; i++) { const value = Math.max(-1, Math.min(1, data[i])); pcm[i] = Math.round(value * (value < 0 ? 32768 : 32767)); }
          planes.push(pcm);
        }
        // Bound synchronous work so the YouTube page stays responsive.
        for (let offset = 0; offset < planes[0].length; offset += 1152) {
          const encoded = encoder.encodeBuffer(planes[0].subarray(offset, offset + 1152), channels === 2 ? planes[1].subarray(offset, offset + 1152) : undefined);
          if (encoded.length) chunks.push(new Uint8Array(encoded));
          if (performance.now() - lastYield > 25) {
            await new Promise(resolve => setTimeout(resolve, 0)); lastYield = performance.now();
            if (!isCurrent()) throw new Error('Dönüşüm durduruldu.');
          }
        }
        frames += to - from;
        onProgress(Math.min(1, frames / ((stop - start) * sampleRate)));
      } finally { sample.close(); }
    }
    if (!frames || !encoder) throw new Error('Seçilen aralıkta ses bulunamadı.');
    const tail = encoder.flush(); if (tail.length) chunks.push(new Uint8Array(tail));
    onProgress(1);
    return new Blob(chunks, { type: 'audio/mpeg' });
  } finally { input.dispose(); }
}
