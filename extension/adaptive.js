// Functions injected into the YouTube page must be self-contained.
export function readAdaptiveVideo(videoId, index = null, audioOnly = false) {
  try {
    const candidates = [document.getElementById('movie_player')?.getPlayerResponse?.(), globalThis.ytInitialPlayerResponse];
    const raw = globalThis.ytplayer?.config?.args?.player_response;
    if (typeof raw === 'string') { try { candidates.push(JSON.parse(raw)); } catch {} }
    const responses = candidates.filter(value => value?.videoDetails?.videoId === videoId);
    const response = responses[0];
    if (!response) throw new Error('Video bilgisi hazır değil.');
    if (response.playabilityStatus?.liveStreamability) throw new Error('Canlı yayın desteklenmiyor.');
    const rawFormats = responses.flatMap(value => value.streamingData?.adaptiveFormats || []);
    const sabrResponse = responses.find(value => value.streamingData?.serverAbrStreamingUrl &&
      value.playerConfig?.mediaCommonConfig?.mediaUstreamerRequestConfig?.videoPlaybackUstreamerConfig);
    const all = rawFormats.filter(f =>
      (f.url || f.signatureCipher || f.cipher || sabrResponse) && !f.drmFamilies?.length && !f.drmTrackType);
    const groups = [
      { extension: 'mp4', video: /^video\/mp4;.*avc1/, audio: /^audio\/mp4;.*mp4a/ },
      { extension: 'webm', video: /^video\/webm;.*(vp9|vp09|av01)/, audio: /^audio\/webm;.*opus/ }
    ];
    const pairs = [];
    if (audioOnly) {
      const choices = all.filter(f => /^audio\/(mp4|webm);/.test(f.mimeType || ''));
      const rank = f => f.audioTrack?.audioIsDefault ? 2 : !f.audioTrack || /original/i.test(f.audioTrack.displayName || '') ? 1 : 0;
      choices.sort((a, b) => rank(b) - rank(a) || Number(b.mimeType.startsWith('audio/mp4')) - Number(a.mimeType.startsWith('audio/mp4')) || (b.bitrate || 0) - (a.bitrate || 0));
      if (!choices[0]) throw new Error('İndirilebilir ses akışı bulunamadı.');
      pairs.push({ video: null, audio: choices[0], extension: choices[0].mimeType.startsWith('audio/mp4') ? 'mp4' : 'webm' });
    }
    for (const group of audioOnly ? [] : groups) {
      const audios = all.filter(f => group.audio.test(f.mimeType || ''));
      const rank = f => f.audioTrack?.audioIsDefault ? 2 : !f.audioTrack || /original/i.test(f.audioTrack.displayName || '') ? 1 : 0;
      const audio = audios.sort((a, b) => rank(b) - rank(a) || (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (!audio) continue;
      const videos = all.filter(f => group.video.test(f.mimeType || ''));
      for (const video of videos) pairs.push({ video, audio, extension: group.extension });
    }
    if (!audioOnly) pairs.sort((a, b) => (b.video.height || 0) - (a.video.height || 0) || (b.video.fps || 0) - (a.video.fps || 0) || (b.video.bitrate || 0) - (a.video.bitrate || 0));
    if (index === null && !audioOnly) {
      const seen = new Set();
      return { warning: !pairs.length ? (rawFormats.some(f => /^video\//.test(f.mimeType || ''))
        ? 'YouTube yüksek kalite akışlarını listeliyor ancak bu oturumda desteklenen görüntü ve ses dosyası bağlantıları birlikte alınamadı.'
        : 'Oynatıcı bu oturumda yüksek kalite dosya bağlantılarını sunmadı.') : null,
        formats: pairs.filter(pair => {
        const key = `${pair.extension}:${pair.video.qualityLabel}:${pair.video.fps}`;
        if (seen.has(key)) return false; seen.add(key); return true;
      }).map(({ video, audio, extension }) => ({ index: video.itag, quality: video.qualityLabel || `${video.height}p`,
        height: video.height || 0, fps: video.fps || 0, extension, adaptive: true,
        size: video.contentLength && audio.contentLength ? Number(video.contentLength) + Number(audio.contentLength) : null })) };
    }
    const pair = audioOnly ? pairs[0] : pairs.find(pair => pair.video.itag === index);
    if (!pair) throw new Error('Bu kalite artık kullanılamıyor. Menüyü yeniden aç.');
    const script = [...document.scripts].find(script => /\/s\/player\/[^/]+\/.+base\.js/.test(script.src));
    const playerId = script?.src.match(/\/s\/player\/([^/]+)\//)?.[1];
    if ((!audioOnly && !(pair.video.url || pair.video.signatureCipher || pair.video.cipher)) || !(pair.audio.url || pair.audio.signatureCipher || pair.audio.cipher)) {
      if (!sabrResponse) throw new Error('SABR yayın bilgisi bulunamadı.');
      const native = globalThis.__openVideoSabrRequest;
      const client = globalThis.ytcfg?.get?.('INNERTUBE_CONTEXT')?.client || {};
      return { sabr: {
        playerId, serverAbrStreamingUrl: sabrResponse.streamingData.serverAbrStreamingUrl,
        videoPlaybackUstreamerConfig: sabrResponse.playerConfig.mediaCommonConfig.mediaUstreamerRequestConfig.videoPlaybackUstreamerConfig,
        formats: audioOnly ? [pair.audio] : [pair.video, pair.audio], videoItag: pair.video?.itag || null, audioItag: pair.audio.itag, audioOnly,
        requestBody: native?.videoId === videoId ? native.body : null,
        clientInfo: { clientName: Number(globalThis.ytcfg?.get?.('INNERTUBE_CONTEXT_CLIENT_NAME') || 1), clientVersion: client.clientVersion || '' }
      }, title: response.videoDetails.title, extension: pair.extension,
        size: Number(pair.video?.contentLength || 0) + Number(pair.audio.contentLength || 0) };
    }
    const describe = f => ({ playerId, url: f.url || null, signatureCipher: f.signatureCipher || null, cipher: f.cipher || null });
    return { video: audioOnly ? null : describe(pair.video), audio: describe(pair.audio), extension: pair.extension,
      title: response.videoDetails.title, quality: pair.video?.qualityLabel || null,
      size: Number(pair.video?.contentLength || 0) + Number(pair.audio.contentLength || 0) };
  } catch (error) { return { error: error.message }; }
}

export async function fetchAdaptiveStreams(videoId, videoUrl, audioUrl, requestId, audioOnly = false) {
  const blobs = [];
  const limit = 512 * 1048576;
  let totalLoaded = 0;
  try {
    for (const [index, address] of (audioOnly ? [audioUrl] : [videoUrl, audioUrl]).entries()) {
      const isAudio = audioOnly || index > 0;
      if (new URL(location.href).searchParams.get('v') !== videoId) throw new Error('Video değiştiği için indirme durduruldu.');
      const url = new URL(address);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.googlevideo.com') || url.pathname !== '/videoplayback') throw new Error('Geçersiz medya kaynağı.');
      const response = await fetch(url, { signal: AbortSignal.timeout(300000) });
      if (!response.ok) throw new Error(`${isAudio ? 'Ses' : 'Görüntü'} alınamadı (HTTP ${response.status}).`);
      const mime = (response.headers.get('content-type') || '').split(';')[0];
      const allowed = isAudio ? ['audio/mp4', 'audio/webm'] : ['video/mp4', 'video/webm'];
      const range = response.headers.get('content-range');
      const match = range && /^bytes (\d+)-(\d+)\/(\d+)$/.exec(range);
      if (!allowed.includes(mime) || (range && (!match || Number(match[1]) !== 0 || Number(match[2]) + 1 !== Number(match[3])))) {
        await response.body?.cancel(); throw new Error('Sunucu geçerli ve tam bir medya dosyası döndürmedi.');
      }
      const length = Number(response.headers.get('content-length')) || 0;
      if (totalLoaded + length > limit) { await response.body?.cancel(); throw new Error('Bu sürümde görüntü ve ses toplamı en fazla 512 MB olabilir.'); }
      const reader = response.body.getReader(); const chunks = []; let loaded = 0; let lastUpdate = 0;
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        loaded += value.byteLength; totalLoaded += value.byteLength;
        if (totalLoaded > limit || new URL(location.href).searchParams.get('v') !== videoId) {
          await reader.cancel(); throw new Error(totalLoaded > limit ? '512 MB bellek sınırına ulaşıldı.' : 'Video değiştiği için indirme durduruldu.');
        }
        chunks.push(value);
        if (Date.now() - lastUpdate > 300) {
          window.postMessage({ source: 'vitools-progress', requestId, phase: isAudio ? 'Ses' : 'Görüntü', loaded, total: length }, location.origin);
          lastUpdate = Date.now();
        }
      }
      if (!loaded) throw new Error('Medya yanıtı boş.');
      const blob = new Blob(chunks, { type: mime });
      const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
      const valid = mime.endsWith('/mp4') ? String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp' : bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
      if (!valid) throw new Error('Medya dosyası doğrulanamadı.');
      const objectUrl = URL.createObjectURL(blob); blobs.push(objectUrl);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 300000);
    }
    return audioOnly ? { audioBlobUrl: blobs[0] } : { videoBlobUrl: blobs[0], audioBlobUrl: blobs[1] };
  } catch (error) {
    blobs.forEach(url => URL.revokeObjectURL(url)); return { error: error.message };
  }
}

