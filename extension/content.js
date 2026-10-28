(() => {
  const ROOT_ID = 'vitools';
  const tabs = [['video', '▸', 'Video İndirme'], ['audio', '♫', 'MP3 Dönüştürücü'], ['thumbnail', '▧', 'Küçük Resimler'], ['subtitles', 'CC', 'Altyazılar'], ['capture', '▣', 'Ekran Görüntüsü']];
  const icons = {
    video: '<path d="M4 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm14 4 4-3v10l-4-3Z"/>',
    audio: '<path d="M9 4v12.2A3.5 3.5 0 1 0 11 19V8l8-2v8.2A3.5 3.5 0 1 0 21 17V1Z"/>',
    thumbnail: '<path fill-rule="evenodd" d="M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v12l5-6 4 4 3-3 4 5V6a1 1 0 0 0-1-1Zm10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>',
    subtitles: '<path fill-rule="evenodd" d="M2 4h20v16H2Zm2 2v12h16V6Zm6 3H7v6h3v-2H9v-2h1Zm7 0h-3v6h3v-2h-1v-2h1Z"/>',
    capture: '<path fill-rule="evenodd" d="m8 4-2 3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2l-2-3Zm4 5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/>'
  };
  const iconSvg = id => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">${icons[id]}</svg>`;
  let placement = 'player';
  let active = null;
  const host = document.createElement('div');
  host.id = ROOT_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>
    :host{display:block;margin:0;font-family:Roboto,Arial,sans-serif;font-size:14px;color:#eee;position:relative;z-index:2100}
    :host(:not([compact])){height:0;overflow:visible;pointer-events:none}
    :host(:not([compact])) #shell{position:absolute;top:4px;right:0;pointer-events:auto}
    *{box-sizing:border-box}button,select,input{font:inherit}button{cursor:pointer;color:inherit;border:0}
    #shell{position:relative;width:fit-content}
    .bar{display:flex;align-items:center;gap:14px;height:44px;padding:4px 10px;width:fit-content}
    .tab{display:grid;place-items:center;background:transparent;color:#c9c9c9;border-radius:50%;padding:0;width:36px;height:36px;transition:background .15s,color .15s}.tab:hover,.tab[aria-expanded=true]{background:#ffffff18;color:#eee}
    .tab:focus-visible,.launch:focus-visible,.close:focus-visible{outline:2px solid #3b7af5;outline-offset:2px}
    .settings{display:none}
    .panel{position:absolute;top:44px;left:0;background:#212121;border:0;border-radius:12px;padding:24px 28px;width:400px;max-width:calc(100vw - 40px);max-height:min(520px,65vh);overflow:auto;box-shadow:0 12px 32px #0005;margin:0;z-index:1}
    :host(:not([compact])) .panel{left:auto;right:0}
    :host([compact]) .panel{top:44px;left:20px}:host([compact]){margin:0 8px}
    :host([compact]) #shell{padding-left:20px}
    :host([compact]) .bar{padding:0;gap:0}
    .panel-tabs{display:flex;gap:12px;padding-bottom:12px;margin:-14px -16px 20px;border-bottom:1px solid #ffffff15}
    h2{font-size:17px;margin:0 0 18px}p{font-size:13px;color:#b9b9b9;line-height:1.6}label{display:block;font-size:13px;margin:16px 0 8px}
    select,input{background:#212121;color:#ddd;border:1px solid #383838;border-radius:4px;padding:13px 14px;width:100%}
    .row{display:flex;gap:12px}.row>div{flex:1}.primary{background:#3b7af5;padding:10px 18px;border-radius:6px}
    .actions{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:18px}
    button:disabled{opacity:.45;cursor:not-allowed}.panel:after{content:'';display:block;clear:both}.badge{font-size:11px;background:#383838;padding:4px 7px;border-radius:5px;color:#ccc}
    .launch{display:flex;align-items:center;gap:8px;background:#ffffff1a;border-radius:22px;padding:11px 18px;font-weight:600}.close{float:right;background:transparent;font-size:18px;color:#aaa}
    .thumbnail-preview{display:block;width:100%;max-height:210px;object-fit:contain;border-radius:4px;background:#151515;margin:8px 0 22px}
    .status{clear:both;margin:12px 0 0;font-size:12px;min-height:18px}.status:empty{display:none}
  </style><div id="shell"></div>`;
  const shell = shadow.querySelector('#shell');
  function draw() {
    shell.replaceChildren();
    const bar = document.createElement('div');
    bar.className = 'bar';
    if (placement === 'subscribe') {
      const launch = document.createElement('button');
      launch.className = 'launch'; launch.innerHTML = iconSvg('video') + ' İndir';
      launch.setAttribute('aria-expanded', String(Boolean(active)));
      launch.onclick = () => { active = active ? null : 'video'; draw(); }; bar.append(launch);
    } else {
      tabs.forEach(([id, icon, title]) => {
        const button = document.createElement('button');
        button.className = 'tab'; button.innerHTML = iconSvg(id); button.title = title;
        button.setAttribute('aria-label', title); button.setAttribute('aria-expanded', String(active === id));
        button.onclick = () => { active = active === id ? null : id; draw(); }; bar.append(button);
      });
      const settings = document.createElement('button');
      settings.className = 'settings'; settings.textContent = '⇄ Konum'; settings.title = 'Araçların konumunu değiştir';
      settings.onclick = () => chrome.storage.local.set({ placement: placement === 'player' ? 'subscribe' : 'player' });
      bar.append(settings);
    }
    shell.append(bar);
    if (!active) return;
    const panel = document.createElement('section'); panel.className = 'panel';
    if (placement === 'subscribe') {
      const panelTabs = document.createElement('div'); panelTabs.className = 'panel-tabs';
      tabs.forEach(([id, , title]) => {
        const button = document.createElement('button'); button.className = 'tab'; button.innerHTML = iconSvg(id);
        button.title = title; button.setAttribute('aria-label', title); button.setAttribute('aria-expanded', String(active === id));
        button.onclick = () => { active = id; draw(); }; panelTabs.append(button);
      });
      panel.append(panelTabs);
    }
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Kapat');
    close.onclick = () => { active = null; draw(); }; panel.append(close);
    const title = document.createElement('h2'); title.textContent = tabs.find(t => t[0] === active)[2]; panel.append(title);
    const bodies = {
      video: '<label>Video kalitesi</label><select disabled><option>Formatlar henüz bağlanmadı</option></select><p>Mevcut video ve ses akışları burada listelenecek.</p>',
      audio: '<label>MP3 bit hızı</label><select><option>128 kbps</option><option>192 kbps</option><option>256 kbps</option><option>320 kbps</option></select><div class="row"><div><label>Başlangıç</label><input value="00:00:00" aria-label="Başlangıç zamanı"></div><div><label>Bitiş</label><input placeholder="00:00:00" aria-label="Bitiş zamanı"></div></div><p>Tarayıcı içi ses dönüşümü sonraki aşamada bağlanacak.</p>',
      thumbnail: '<label>Küçük resim kalitesi</label><select disabled><option>Görseller henüz bağlanmadı</option></select><p>Küçük resim önizlemesi ve çözünürlük seçenekleri burada yer alacak.</p>',
      subtitles: '<label>Altyazı dili</label><select disabled><option>Altyazılar henüz bağlanmadı</option></select><label>Dosya biçimi</label><select><option>SRT</option><option>WebVTT</option><option>TTML</option><option>SRV3</option></select>',
      capture: '<p>Oynatıcının geçerli karesinden ekran görüntüsü alma işlevi burada yer alacak.</p><label>Dosya biçimi</label><select><option>PNG</option><option>JPEG</option></select>'
    };
    const body = document.createElement('div'); body.innerHTML = bodies[active]; panel.append(body);
    const download = document.createElement('button'); download.className = 'primary'; download.textContent = 'İndir'; download.disabled = true;
    const actions = document.createElement('div'); actions.className = 'actions'; actions.append(download); panel.append(actions);
    shell.append(panel);
    if (active === 'thumbnail') setupThumbnails(body, download, panel);
    if (active === 'capture') setupCapture(body, download);
    if (active === 'subtitles') setupSubtitles(body, download, panel);
    if (active === 'video') setupVideo(body, download, panel);
    if (active === 'audio') setupAudio(body, download, panel);
  }
  function setupAudio(body, download, panel) {
    const videoId = new URL(location.href).searchParams.get('v');
    const video = document.querySelector('#movie_player video');
    const duration = Number.isFinite(video?.duration) ? video.duration : 0;
    const timestamp = seconds => {
      const whole = Math.max(0, Math.floor(seconds));
      return [Math.floor(whole / 3600), Math.floor(whole / 60) % 60, whole % 60].map(n => String(n).padStart(2, '0')).join(':');
    };
    body.innerHTML = '<label for="mp3-bitrate">MP3 bit hızı</label><select id="mp3-bitrate"><option value="128">128 kbps</option><option value="192">192 kbps</option><option value="256">256 kbps</option><option value="320">320 kbps</option></select><div class="row"><div><label for="mp3-start">Başlangıç</label><input id="mp3-start" value="00:00:00" inputmode="numeric"></div><div><label for="mp3-end">Bitiş</label><input id="mp3-end" inputmode="numeric"></div></div><button class="use-player" type="button" style="background:transparent;color:#aaa;margin-top:12px;padding:0">Başlangıcı oynatıcıdan al</button><p>Yalnızca ses indirilir ve MP3’e dönüştürülür. İşlem sırasında bu menüyü ve sayfayı açık tut.</p><p class="status" role="status" aria-live="polite"></p>';
    const bitrate = body.querySelector('select'); const start = body.querySelector('#mp3-start'); const end = body.querySelector('#mp3-end');
    const status = body.querySelector('.status'); const sync = body.querySelector('.use-player');
    end.value = duration ? `${timestamp(duration)}.${String(Math.floor((duration % 1) * 1000)).padStart(3, '0')}` : '';
    sync.onclick = () => { start.value = timestamp(document.querySelector('#movie_player video')?.currentTime || 0); };
    download.parentElement.after(status); download.disabled = false;
    const current = () => panel.isConnected && new URL(location.href).searchParams.get('v') === videoId;
    download.onclick = async () => {
      const requestId = crypto.randomUUID(); let sourceUrl;
      const controls = [download, bitrate, start, end, sync];
      const progress = event => {
        if (event.source === window && event.origin === location.origin && event.data?.source === 'vitools-progress' && event.data.requestId === requestId && current() && Number.isFinite(event.data.loaded)) {
          status.textContent = `Ses indiriliyor… ${(event.data.loaded / 1048576).toFixed(1)} MB`;
        }
      };
      try {
        const { encodeMp3, parseAudioTime } = await import(chrome.runtime.getURL('audio.js'));
        const from = parseAudioTime(start.value); const to = parseAudioTime(end.value);
        const liveDuration = document.querySelector('#movie_player video')?.duration;
        if (to <= from || !Number.isFinite(liveDuration) || to > liveDuration + 0.25) throw new Error('Geçerli bir başlangıç ve bitiş aralığı seç.');
        controls.forEach(control => { control.disabled = true; });
        window.addEventListener('message', progress); status.textContent = 'Ses hazırlanıyor…';
        const result = await chrome.runtime.sendMessage({ type: 'download-audio', videoId, requestId });
        if (!current()) return;
        if (result?.error) throw new Error(result.error);
        let audioBlob;
        if (result.sabr) {
          const { downloadSabr } = await import(chrome.runtime.getURL('sabr.js'));
          [, audioBlob] = await downloadSabr(result.sabr, videoId, loaded => {
            if (current()) status.textContent = `Ses indiriliyor… ${(loaded / 1048576).toFixed(1)} MB`;
          }, current);
        } else {
          sourceUrl = result.audioBlobUrl;
          if (typeof sourceUrl !== 'string' || !sourceUrl.startsWith('blob:https://www.youtube.com/')) throw new Error('Ses kaynağı geçersiz.');
          const response = await fetch(sourceUrl); if (!response.ok) throw new Error('Ses okunamadı.');
          audioBlob = await response.blob();
        }
        if (!current()) return;
        status.textContent = 'MP3’e dönüştürülüyor…';
        const blob = await encodeMp3(audioBlob, { start: from, end: to, bitrate: Number(bitrate.value), isCurrent: current,
          onProgress: fraction => { if (current()) status.textContent = `MP3’e dönüştürülüyor… %${Math.round(fraction * 100)}`; } });
        if (!current()) return;
        const url = URL.createObjectURL(blob);
        const title = String(result.title || videoId).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 100) || videoId;
        const link = document.createElement('a'); link.href = url; link.download = `${title} - ${bitrate.value}kbps.mp3`;
        body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
        status.textContent = 'MP3 hazır; kaydetme isteği gönderildi.';
      } catch (error) { if (current()) status.textContent = error.message; }
      finally {
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        window.removeEventListener('message', progress); controls.forEach(control => { control.disabled = false; });
      }
    };
  }
  async function setupVideo(body, download, panel) {
    const videoId = new URL(location.href).searchParams.get('v');
    body.innerHTML = '<label for="video-quality">Video kalitesi</label><select id="video-quality" disabled><option>Kaliteler yükleniyor…</option></select><p>Görüntü ve ses tek dosyada kaydedilir. Yüksek kaliteler tarayıcıda birleştirilir; toplam boyut sınırı 512 MB.</p><p class="status" role="status" aria-live="polite"></p>';
    const select = body.querySelector('select');
    const status = body.querySelector('.status');
    download.parentElement.after(status);
    const current = () => panel.isConnected && new URL(location.href).searchParams.get('v') === videoId;
    try {
      const [progressive, adaptive] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'list-video', videoId }),
        chrome.runtime.sendMessage({ type: 'list-adaptive', videoId })
      ]);
      const result = { formats: [...(adaptive?.formats || []), ...(progressive?.formats || [])] };
      result.formats.sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));
      if (!current()) return;
      if (adaptive?.error || adaptive?.warning) {
        const note = document.createElement('p'); note.setAttribute('role', 'status');
        note.textContent = adaptive.error || adaptive.warning; body.append(note);
      }
      if (!result.formats.length && (progressive?.error || adaptive?.error)) throw new Error(adaptive?.error || progressive.error);
      if (!result?.formats?.length) {
        select.options[0].textContent = 'Desteklenen indirme biçimi bulunamadı';
        status.textContent = 'Bu video için desteklenen sesli bir dosya veya birleştirilebilir görüntü/ses akışı bulunamadı.'; return;
      }
      select.replaceChildren(...result.formats.map(format => {
        const option = document.createElement('option'); option.value = format.index;
        option.textContent = `${format.extension.toUpperCase()} · ${format.quality}${format.size ? ` · ${(format.size / 1048576).toFixed(1)} MB` : ''}${format.adaptive ? ' · Sesli' : ''}`;
        option.dataset.adaptive = String(Boolean(format.adaptive));
        return option;
      }));
      select.disabled = false; download.disabled = false;
      download.onclick = async () => {
          download.disabled = true; select.disabled = true; status.textContent = 'Video alınıyor ve doğrulanıyor… Video tamamlanana kadar sayfayı kapatma.';
        const requestId = crypto.randomUUID();
        const progress = event => {
          if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'vitools-progress' || event.data.requestId !== requestId || !current()) return;
          const { phase, loaded, total } = event.data;
          if (Number.isFinite(loaded) && Number.isFinite(total)) status.textContent = `${phase} indiriliyor… ${(loaded / 1048576).toFixed(1)} MB${total ? ` / ${(total / 1048576).toFixed(1)} MB` : ''}`;
        };
        window.addEventListener('message', progress);
        try {
          const isAdaptive = select.selectedOptions[0].dataset.adaptive === 'true';
          const response = await chrome.runtime.sendMessage({ type: isAdaptive ? 'download-adaptive' : 'download-video', videoId, index: Number(select.value), requestId });
          if (!current()) return;
          if (response?.error) throw new Error(response.error);
          if (isAdaptive) {
            const addresses = response.sabr ? [] : [response.videoBlobUrl, response.audioBlobUrl];
            if (!addresses.every(url => typeof url === 'string' && url.startsWith('blob:https://www.youtube.com/'))) throw new Error('Medya kaynağı geçersiz.');
            try {
              let videoBlob, audioBlob;
              if (response.sabr) {
                status.textContent = 'Yüksek kalite yayını indiriliyor…';
                const { downloadSabr } = await import(chrome.runtime.getURL('sabr.js'));
                [videoBlob, audioBlob] = await downloadSabr(response.sabr, videoId,
                  loaded => { if (current()) status.textContent = `Görüntü ve ses indiriliyor… ${(loaded / 1048576).toFixed(1)} MB`; }, current);
              } else {
                [videoBlob, audioBlob] = await Promise.all([
                  fetch(addresses[0]).then(r => { if (!r.ok) throw new Error('Görüntü okunamadı.'); return r.blob(); }),
                  fetch(addresses[1]).then(r => { if (!r.ok) throw new Error('Ses okunamadı.'); return r.blob(); })
                ]);
              }
              if (!current()) return;
              status.textContent = 'Görüntü ve ses birleştiriliyor…';
              const { muxVideoAudio } = await import(chrome.runtime.getURL('mux.js'));
              const blob = await muxVideoAudio(videoBlob, audioBlob, response.extension);
              if (!current()) return;
              const url = URL.createObjectURL(blob);
              const title = String(response.title || videoId).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 100) || videoId;
              const link = document.createElement('a'); link.href = url;
              link.download = `${title} - ${videoId}.${response.extension === 'webm' ? 'webm' : 'mp4'}`;
              body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
            } finally { addresses.forEach(url => URL.revokeObjectURL(url)); }
          }
          status.textContent = 'İndirme tarayıcıya iletildi. İlerlemeyi ve olası hataları Chrome’un İndirilenler bölümünden takip edebilirsin.';
        } catch (error) { status.textContent = `İndirme başlatılamadı: ${error.message}`; }
        finally { window.removeEventListener('message', progress); download.disabled = false; select.disabled = false; }
      };
    } catch (error) { if (current()) { select.options[0].textContent = 'Kaliteler yüklenemedi'; status.textContent = error.message; } }
  }
  async function setupSubtitles(body, download, panel) {
    const videoId = new URL(location.href).searchParams.get('v');
    body.innerHTML = '<label for="subtitle-language">Dil seç</label><select id="subtitle-language" disabled><option>Altyazılar yükleniyor…</option></select><p>Otomatik oluşturulan altyazılar dil adının yanında belirtilir.</p><label for="subtitle-format">Dosya biçimi seç</label><select id="subtitle-format"><option value="srt">SRT</option><option value="vtt">WebVTT</option></select><p class="status" role="status" aria-live="polite"></p>';
    const language = body.querySelector('#subtitle-language');
    const format = body.querySelector('#subtitle-format');
    const status = body.querySelector('.status');
    download.parentElement.after(status);
    const current = () => panel.isConnected && new URL(location.href).searchParams.get('v') === videoId;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'list-subtitles', videoId });
      if (!current()) return;
      if (response?.error) throw new Error(response.error);
      if (!response?.tracks?.length) { language.options[0].textContent = 'Altyazı bulunamadı'; status.textContent = 'Bu videoda kullanılabilir altyazı yok.'; return; }
      language.replaceChildren(...response.tracks.map(track => {
        const option = document.createElement('option'); option.value = track.index;
        option.textContent = `${track.name}${track.automatic ? ' · Otomatik' : ''}`; return option;
      }));
      language.disabled = false; download.disabled = false;
      download.onclick = async () => {
        const selected = response.tracks.find(track => track.index === Number(language.value));
        const extension = format.value;
        download.disabled = true; language.disabled = true; format.disabled = true;
        status.textContent = 'Altyazı hazırlanıyor…';
        try {
          const result = await chrome.runtime.sendMessage({ type: 'fetch-subtitles', videoId, index: selected.index });
          if (!current()) return;
          if (result?.error) throw new Error(result.error);
          const text = globalThis.formatSubtitles(result.data, extension);
          const url = URL.createObjectURL(new Blob([text], { type: extension === 'vtt' ? 'text/vtt;charset=utf-8' : 'application/x-subrip;charset=utf-8' }));
          const title = (document.querySelector('ytd-watch-metadata h1')?.textContent?.trim() || videoId).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 100);
          const link = document.createElement('a'); link.href = url;
          link.download = `${title}.${String(selected.language).replace(/[^a-zA-Z0-9-]/g, '_')}.${extension}`;
          body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
          status.textContent = 'Altyazı kaydetme isteği gönderildi.';
        } catch (error) { status.textContent = error.message; }
        finally { download.disabled = false; language.disabled = false; format.disabled = false; }
      };
    } catch (error) { if (current()) { language.options[0].textContent = 'Altyazılar yüklenemedi'; status.textContent = error.message; } }
  }
  function setupCapture(body, download) {
    body.innerHTML = '<img class="thumbnail-preview" alt="Yakalanan video karesi" hidden><p class="capture-time"></p><label for="capture-format">Dosya biçimi</label><select id="capture-format"><option value="png">PNG</option><option value="jpeg">JPEG</option></select><button class="refresh-frame primary" type="button">Kareyi yenile</button><p class="status" role="status" aria-live="polite"></p>';
    const preview = body.querySelector('img');
    const format = body.querySelector('select');
    const status = body.querySelector('.status');
    const timeLabel = body.querySelector('.capture-time');
    const refresh = body.querySelector('.refresh-frame');
    download.parentElement.prepend(refresh);
    download.parentElement.after(status);
    const canvas = document.createElement('canvas');
    let frameTime = 0;
    function capture() {
      download.disabled = true; status.textContent = ''; preview.hidden = true;
      const video = document.querySelector('#movie_player video');
      if (!video || video.readyState < 2 || !video.videoWidth) {
        status.textContent = 'Video henüz hazır değil. Videoyu başlatıp Kareyi yenile düğmesine bas.'; return;
      }
      try {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        frameTime = video.currentTime;
        // Export once here so a cross-origin restriction is reported before download.
        preview.src = canvas.toDataURL('image/png'); preview.hidden = false;
        const seconds = Math.floor(frameTime);
        const timestamp = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
        timeLabel.textContent = `${timestamp} · ${canvas.width} × ${canvas.height}`;
        download.disabled = false;
      } catch {
        timeLabel.textContent = '';
        status.textContent = 'Tarayıcı bu videonun karesini kaydetmeye izin vermedi.';
      }
    }
    body.querySelector('.refresh-frame').onclick = capture;
    download.onclick = () => {
      download.disabled = true;
      const type = format.value === 'jpeg' ? 'jpeg' : 'png';
      canvas.toBlob(blob => {
        download.disabled = false;
        if (!blob) { status.textContent = 'Görüntü oluşturulamadı. Kareyi yenileyip tekrar dene.'; return; }
        const url = URL.createObjectURL(blob);
        const title = (document.querySelector('ytd-watch-metadata h1')?.textContent?.trim() || 'video').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 100);
        const link = document.createElement('a');
        link.href = url; link.download = `${title} - ${frameTime.toFixed(2)}s.${type === 'jpeg' ? 'jpg' : 'png'}`;
        body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        status.textContent = 'Ekran görüntüsü kaydetme isteği gönderildi.';
      }, `image/${type}`, 0.95);
    };
    capture();
  }
  async function setupThumbnails(body, download, panel) {
    const videoId = new URL(location.href).searchParams.get('v');
    body.innerHTML = '<img class="thumbnail-preview" alt="Video küçük resmi" hidden><label for="thumbnail-quality">Kalite seç</label><select id="thumbnail-quality" disabled><option>Küçük resimler yükleniyor…</option></select><p class="status" role="status" aria-live="polite"></p>';
    const preview = body.querySelector('img');
    const select = body.querySelector('select');
    const status = body.querySelector('.status');
    if (!/^[\w-]{11}$/.test(videoId || '')) { status.textContent = 'Video kimliği bulunamadı.'; return; }
    const qualities = [
      ['maxresdefault', 'En yüksek çözünürlük', 1280],
      ['sddefault', 'Standart kalite', 640],
      ['hqdefault', 'Yüksek kalite', 480],
      ['mqdefault', 'Orta kalite', 320],
      ['default', 'Düşük kalite', 120]
    ];
    const results = await Promise.all(qualities.map(([key, label, minWidth]) => new Promise(resolve => {
      const img = new Image();
      const timer = setTimeout(() => { img.onload = img.onerror = null; resolve(null); }, 8000);
      img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth >= minWidth ? { key, label, width: img.naturalWidth, height: img.naturalHeight, url: img.src } : null); };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = `https://i.ytimg.com/vi/${videoId}/${key}.jpg`;
    })));
    if (!panel.isConnected || new URL(location.href).searchParams.get('v') !== videoId) return;
    const available = results.filter(Boolean);
    if (!available.length) { select.options[0].textContent = 'Küçük resim bulunamadı'; status.textContent = 'Görseller yüklenemedi. Sekmeyi yeniden açarak tekrar deneyebilirsin.'; return; }
    select.replaceChildren(...available.map(item => {
      const option = document.createElement('option'); option.value = item.key;
      option.textContent = `${item.label} (${item.width} × ${item.height})`; return option;
    }));
    function updatePreview() { preview.src = available.find(item => item.key === select.value).url; preview.hidden = false; status.textContent = ''; }
    select.disabled = false; download.disabled = false; updatePreview();
    select.addEventListener('change', updatePreview);
    download.onclick = async () => {
      download.disabled = true; status.textContent = 'Kaydetme penceresi açılıyor…';
      try {
        const response = await chrome.runtime.sendMessage({ type: 'download-thumbnail', videoId, quality: select.value,
          title: document.querySelector('ytd-watch-metadata h1')?.textContent?.trim() || videoId });
        if (response?.error) throw new Error(response.error);
        status.textContent = 'İndirme isteği tarayıcıya iletildi.';
      } catch (error) { status.textContent = `İndirme başlatılamadı: ${error.message}`; }
      finally { download.disabled = false; }
    };
  }
  function mount() {
    if (location.pathname !== '/watch') { host.remove(); return; }
    const target = placement === 'subscribe'
      ? document.querySelector('ytd-watch-metadata #owner')
      : document.querySelector('#player-container-outer');
    if (!target) return;
    host.toggleAttribute('compact', placement === 'subscribe');
    if (placement === 'subscribe') { if (host.parentElement !== target) target.append(host); }
    else if (target.nextElementSibling !== host) target.after(host);
  }
  chrome.storage.local.get({ placement: 'player' }).then(settings => { placement = settings.placement; draw(); mount(); });
  document.addEventListener('pointerdown', event => {
    if (active && !event.composedPath().includes(host)) { active = null; draw(); }
  });
  document.addEventListener('keydown', event => {
    if (active && event.key === 'Escape') { active = null; draw(); }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.placement) { placement = changes.placement.newValue; draw(); mount(); }
  });
  document.addEventListener('yt-navigate-finish', () => { active = null; draw(); mount(); });
  let queued = false;
  new MutationObserver(() => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

