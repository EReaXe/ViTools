import { SabrStream, buildSabrFormat, Logger } from './vendor/googlevideo.mjs';
Logger.getInstance().setLogLevels();

export async function downloadSabr(config, videoId, onProgress = () => {}, isCurrent = () => true) {
  const url = new URL(config.serverAbrStreamingUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.googlevideo.com') || url.pathname !== '/videoplayback') throw new Error('SABR kaynağı geçersiz.');
  const stream = new SabrStream({ ...config, videoId, formats: config.formats.map(buildSabrFormat),
    stripDuplicateInit: true, videoHighWaterMark: 2 * 1048576, audioHighWaterMark: 1048576,
    fetchFunction: (address, options) => {
      const source = new URL(address instanceof Request ? address.url : address);
      if (source.protocol !== 'https:' || !source.hostname.endsWith('.googlevideo.com') || source.pathname !== '/videoplayback') throw new Error('SABR yönlendirmesi desteklenmiyor.');
      const headers = new Headers(options?.headers);
      headers.delete('accept-encoding');
      return fetch(address, { ...options, headers });
    }
  });
  let failure = null; let total = 0;
  stream.on('error', error => { failure = error; });
  const timeout = setTimeout(() => { failure = new Error('Yayın indirme zaman aşımına uğradı.'); void stream.abort(); }, 300000);
  try {
    const result = stream.start({ videoFormat: config.videoItag || undefined, audioFormat: config.audioItag, enabledTrackTypes: config.audioOnly ? 1 : 0, maxRetries: 1, stallDetectionMs: 20000 });
    async function collect(source, type) {
      const reader = source.getReader(); const chunks = [];
      try {
        while (true) {
          const { value, done } = await reader.read(); if (done) break;
          if (!isCurrent()) throw new Error('Video değiştiği için indirme durduruldu.');
          if (failure) throw failure;
          total += value.byteLength;
          if (total > 512 * 1048576) throw new Error('512 MB boyut sınırına ulaşıldı.');
          chunks.push(new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice());
          onProgress(total);
        }
      } finally { reader.releaseLock(); }
      if (failure) throw failure;
      if (!chunks.length) throw new Error('YouTube yayın verisi göndermedi. Videoyu birkaç saniye oynatıp tekrar dene.');
      return new Blob(chunks, { type });
    }
    const webm = config.formats.some(f => /^(video|audio)\/webm/.test(f.mimeType || ''));
    if (config.audioOnly) return [null, await collect(result.audioStream, webm ? 'audio/webm' : 'audio/mp4')];
    return await Promise.all([collect(result.videoStream, webm ? 'video/webm' : 'video/mp4'), collect(result.audioStream, webm ? 'audio/webm' : 'audio/mp4')]);
  } catch (error) {
    await stream.abort();
    throw new Error(`Yüksek kalite yayını alınamadı: ${error.message}`);
  } finally { clearTimeout(timeout); if (stream.isBusy) await stream.abort(); }
}
