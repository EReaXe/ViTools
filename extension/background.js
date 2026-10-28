import { decipherVideo } from './video-decipher.js';
import { readAdaptiveVideo, fetchAdaptiveStreams } from './adaptive.js';
import { VideoPlaybackAbrRequest } from './vendor/googlevideo.mjs';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (['list-adaptive', 'download-adaptive', 'download-audio'].includes(message.type)) {
    if (!sender.tab || !/^https:\/\/www\.youtube\.com\//.test(sender.url || '') || !/^[\w-]{11}$/.test(message.videoId)) {
      sendResponse({ error: 'Geçersiz video isteği.' }); return;
    }
    (async () => {
      const results = await chrome.scripting.executeScript({ target: { tabId: sender.tab.id }, world: 'MAIN', func: readAdaptiveVideo,
        args: [message.videoId, message.type === 'download-adaptive' && Number.isInteger(message.index) ? message.index : null, message.type === 'download-audio'] });
      const result = results[0]?.result;
      if (!result || result.error) throw new Error(result?.error || 'Video bilgisi alınamadı.');
      if (message.type === 'list-adaptive') { sendResponse(result); return; }
      if (result.size > 512 * 1048576) throw new Error('Bu sürümde görüntü ve ses toplamı en fazla 512 MB olabilir. Daha düşük kalite seç.');
      if (result.sabr) {
        const sabr = result.sabr;
        const url = await decipherVideo({ playerId: sabr.playerId, url: sabr.serverAbrStreamingUrl });
        let context;
        if (Array.isArray(sabr.requestBody) && sabr.requestBody.length <= 65536) {
          try { context = VideoPlaybackAbrRequest.decode(Uint8Array.from(sabr.requestBody)).streamerContext; } catch {}
        }
        const poToken = context?.poToken?.length ? btoa(String.fromCharCode(...context.poToken)) : undefined;
        sendResponse({ sabr: { serverAbrStreamingUrl: url, videoPlaybackUstreamerConfig: sabr.videoPlaybackUstreamerConfig,
          formats: sabr.formats, videoItag: sabr.videoItag, audioItag: sabr.audioItag, audioOnly: Boolean(sabr.audioOnly),
          clientInfo: context?.clientInfo || sabr.clientInfo, ...(poToken ? { poToken } : {}) }, extension: result.extension, title: result.title });
        return;
      }
      const audioOnly = message.type === 'download-audio';
      if ((!audioOnly && !result.video) || !result.audio) throw new Error('Kalite seçimi geçersiz.');
      const videoUrl = audioOnly ? null : await decipherVideo(result.video);
      const audioUrl = await decipherVideo(result.audio);
      const media = await chrome.scripting.executeScript({ target: { tabId: sender.tab.id }, world: 'MAIN', func: fetchAdaptiveStreams,
        args: [message.videoId, videoUrl, audioUrl, String(message.requestId || ''), audioOnly] });
      const blobs = media[0]?.result;
      if (!blobs || blobs.error) throw new Error(blobs?.error || 'Medya alınamadı.');
      sendResponse({ ...blobs, extension: result.extension, title: result.title });
    })().catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (['list-subtitles', 'fetch-subtitles', 'list-video', 'download-video'].includes(message.type)) {
    if (!sender.tab || !/^https:\/\/www\.youtube\.com\//.test(sender.url || '') || !/^[\w-]{11}$/.test(message.videoId)) {
      sendResponse({ error: 'Geçersiz altyazı isteği.' }); return;
    }
    const injection = { target: { tabId: sender.tab.id }, world: 'MAIN',
      args: [message.type, message.videoId, Number.isInteger(message.index) ? message.index : null],
      func: async (type, videoId, index, decodedUrl = null) => {
        try {
          const player = document.getElementById('movie_player');
          const response = player?.getPlayerResponse?.();
          if (response?.videoDetails?.videoId !== videoId) throw new Error('Video bilgisi henüz hazır değil. Videoyu başlatıp tekrar dene.');
          if (type === 'list-video' || type === 'download-video') {
            if (response.videoDetails.isLiveContent && response.playabilityStatus?.liveStreamability) throw new Error('Canlı yayın indirme henüz desteklenmiyor.');
            const formats = (response.streamingData?.formats || []).filter(format => {
              if (!(format.url || format.signatureCipher || format.cipher) || format.drmFamilies?.length || format.drmTrackType) return false;
              const mime = format.mimeType || '';
              return /^video\/(mp4|webm);/.test(mime) && /mp4a|opus|vorbis/.test(mime);
            }).sort((a, b) => (b.height || 0) - (a.height || 0));
            if (type === 'list-video') return { separateQualities: [...new Set((response.streamingData?.adaptiveFormats || []).filter(f => f.qualityLabel).map(f => f.qualityLabel))], formats: formats.map(format => ({
              index: format.itag, quality: format.qualityLabel || `${format.height}p`,
              extension: format.mimeType.startsWith('video/webm') ? 'webm' : 'mp4',
              size: Number(format.contentLength) || null
            })) };
            const format = formats.find(format => format.itag === index);
            if (!format) throw new Error('Bu kalite artık kullanılamıyor. Menüyü kapatıp yeniden aç.');
            if (!decodedUrl) {
              const script = [...document.scripts].find(script => /\/s\/player\/[^/]+\/.+base\.js/.test(script.src));
              const playerId = script?.src.match(/\/s\/player\/([^/]+)\//)?.[1];
              return { needsDecipher: true, playerId, url: format.url || null,
                signatureCipher: format.signatureCipher || null, cipher: format.cipher || null };
            }
            const resolved = decodedUrl;
            const url = new URL(resolved);
            if (url.protocol !== 'https:' || !url.hostname.endsWith('.googlevideo.com') || url.pathname !== '/videoplayback') throw new Error('Video kaynağı desteklenmiyor.');
            const media = await fetch(url.href, { signal: AbortSignal.timeout(120000) });
            if (!media.ok) throw new Error(`YouTube video isteğini reddetti (HTTP ${media.status}). Bu akışın bağlantısı ek çözümleme gerektiriyor; henüz desteklenmiyor.`);
            const mime = (media.headers.get('content-type') || '').split(';')[0].trim();
            const range = media.headers.get('content-range');
            if (range) {
              const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(range);
              if (!match || Number(match[1]) !== 0 || Number(match[2]) + 1 !== Number(match[3])) {
                await media.body?.cancel(); throw new Error('Sunucu videonun yalnızca bir parçasını döndürdü. Eksik dosya kaydedilmedi.');
              }
            }
            if (!['video/mp4', 'video/webm'].includes(mime)) {
              await media.body?.cancel();
              throw new Error('Sunucu video yerine farklı bir yanıt gönderdi. Hatalı dosya kaydedilmedi.');
            }
            const limit = 256 * 1048576;
            if (Number(media.headers.get('content-length')) > limit) { await media.body?.cancel(); throw new Error('Bu ilk sürümde tek dosya indirme sınırı 256 MB.'); }
            const reader = media.body.getReader();
            const chunks = []; let size = 0;
            while (true) {
              const { value, done } = await reader.read(); if (done) break;
              size += value.byteLength;
              if (size > limit) { await reader.cancel(); throw new Error('Bu ilk sürümde tek dosya indirme sınırı 256 MB.'); }
              chunks.push(value);
            }
            if (!size) throw new Error('YouTube boş video yanıtı gönderdi.');
            const blob = new Blob(chunks, { type: mime });
            const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
            const mp4 = String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp';
            const webm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
            if (!(mime === 'video/mp4' ? mp4 : webm)) throw new Error('Yanıt geçerli bir video dosyası değil. Kaydetme iptal edildi.');
            const blobUrl = URL.createObjectURL(blob);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 300000);
            return { url: blobUrl, title: response.videoDetails.title,
              extension: format.mimeType.startsWith('video/webm') ? 'webm' : 'mp4', quality: format.qualityLabel || String(format.itag) };
          }
          const tracks = response.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
          if (type === 'list-subtitles') return { tracks: tracks.map((track, i) => ({ index: i,
            language: track.languageCode,
            name: track.name?.simpleText || track.name?.runs?.map(run => run.text).join('') || track.languageCode,
            automatic: track.kind === 'asr'
          })) };
          if (!Number.isInteger(index) || !tracks[index]) throw new Error('Altyazı dili bulunamadı.');
          const cached = () => (globalThis.__openVideoCaptionCache || []).findLast(item =>
            item.videoId === videoId && item.language === tracks[index].languageCode &&
            item.kind === (tracks[index].kind || '') && !item.translated);
          if (cached()) return { data: cached().data };
          const url = new URL(tracks[index].baseUrl);
          if (url.origin !== location.origin || url.pathname !== '/api/timedtext') throw new Error('Altyazı kaynağı desteklenmiyor.');
          url.searchParams.set('fmt', 'json3');
          const result = await fetch(url, { credentials: 'same-origin', signal: AbortSignal.timeout(15000) });
          if (!result.ok) throw new Error(`Altyazı alınamadı (${result.status}).`);
          const text = await result.text();
          if (!text.trim()) {
            if (cached()) return { data: cached().data };
            throw new Error('Oynatıcının ⚙ Ayarlar → Altyazılar menüsünden indirmek istediğin dili seçip altyazıyı aç. Metin göründükten sonra burada tekrar İndir’e bas.');
          }
          return { data: JSON.parse(text) };
        } catch (error) { return { error: error.message }; }
      }
    };
    chrome.scripting.executeScript(injection).then(async results => {
      let result = results[0]?.result || { error: 'Video bilgisi alınamadı.' };
      if (result.needsDecipher) {
        try {
          const decodedUrl = await decipherVideo(result);
          const next = await chrome.scripting.executeScript({ ...injection, args: [...injection.args, decodedUrl] });
          result = next[0]?.result || { error: 'Video alınamadı.' };
        } catch {
          sendResponse({ error: 'Bu videonun bağlantısı çözümlenemedi. Video indirme motorunun bu oynatıcı sürümü için güncellenmesi gerekiyor.' }); return;
        }
      }
      if (message.type !== 'download-video' || result.error) { sendResponse(result); return; }
      try {
        const url = new URL(result.url);
        if (!result.url.startsWith('blob:https://www.youtube.com/')) throw new Error('Geçersiz video kaynağı.');
        const title = String(result.title || message.videoId).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 100) || message.videoId;
        const extension = result.extension === 'webm' ? 'webm' : 'mp4';
        const id = await chrome.downloads.download({ url: url.href, filename: `${title} - ${message.videoId}.${extension}`, saveAs: true });
        sendResponse({ id });
      } catch (error) { sendResponse({ error: error.message }); }
    }, error => sendResponse({ error: error.message }));
    return true;
  }
  if (message.type !== 'download-thumbnail') return;
  if (!sender.tab || !/^https:\/\/www\.youtube\.com\//.test(sender.url || '') ||
      !/^[\w-]{11}$/.test(message.videoId) ||
      !['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'].includes(message.quality)) {
    sendResponse({ error: 'Geçersiz küçük resim isteği.' }); return;
  }
  const title = String(message.title || message.videoId).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 100) || 'thumbnail';
  chrome.downloads.download({
    url: `https://i.ytimg.com/vi/${message.videoId}/${message.quality}.jpg`,
    filename: `${title} - ${message.videoId} - ${message.quality}.jpg`,
    saveAs: true
  }).then(id => sendResponse({ id }), error => sendResponse({ error: error.message }));
  return true;
});
