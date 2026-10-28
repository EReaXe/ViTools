(() => {
  // Keep only this tab's caption responses, in memory; never persist signed URLs.
  const cache = [];
  globalThis.__openVideoCaptionCache = cache;
  // Resource Timing records the URL after the player has prepared its request.
  // Match the media ID as well as itag to avoid reusing a previous video's URL.
  globalThis.__openVideoResolveMediaUrl = (original, itag) => {
    const base = new URL(original);
    const entries = performance.getEntriesByType('resource');
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.responseStatus && entry.responseStatus >= 400) continue;
      try {
        const candidate = new URL(entry.name);
        if (candidate.protocol !== 'https:' || !candidate.hostname.endsWith('.googlevideo.com') || candidate.pathname !== '/videoplayback') continue;
        if (!base.searchParams.get('id') || candidate.searchParams.get('id') !== base.searchParams.get('id') || candidate.searchParams.get('itag') !== String(itag)) continue;
        if (candidate.searchParams.has('sq') || candidate.searchParams.has('sabr')) continue;
        const signed = (candidate.searchParams.get('sparams') || '').split(',');
        if (signed.includes('range') && candidate.searchParams.has('range')) continue;
        candidate.searchParams.delete('range');
        return candidate.href;
      } catch {}
    }
    return original;
  };
  function captionUrl(value) {
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin && url.pathname === '/api/timedtext' ? url : null;
    } catch { return null; }
  }
  function remember(url, text) {
    if (!text?.trim()) return;
    try {
      let data;
      if (text.trim().startsWith('{')) data = JSON.parse(text);
      else {
        const xml = new DOMParser().parseFromString(text, 'text/xml');
        if (xml.querySelector('parsererror')) return;
        const nodes = [...xml.querySelectorAll('p[t], text[start]')];
        data = { events: nodes.map(node => ({
          tStartMs: node.hasAttribute('t') ? Number(node.getAttribute('t')) : Number(node.getAttribute('start')) * 1000,
          dDurationMs: node.hasAttribute('d') ? Number(node.getAttribute('d')) : Number(node.getAttribute('dur')) * 1000,
          segs: [{ utf8: node.textContent }]
        })) };
      }
      if (!data.events?.some(event => event.segs?.some(seg => seg.utf8?.trim()))) return;
      cache.push({ videoId: url.searchParams.get('v'), language: url.searchParams.get('lang'),
        kind: url.searchParams.get('kind') || '', translated: url.searchParams.has('tlang'), data });
      if (cache.length > 12) cache.shift();
    } catch { /* Non-caption responses are ignored. */ }
  }
  const originalFetch = window.fetch;
  function rememberSabr(address, body) {
    try {
      const url = new URL(address, location.href);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.googlevideo.com') || url.pathname !== '/videoplayback') return;
      const bytes = body instanceof ArrayBuffer ? new Uint8Array(body) : ArrayBuffer.isView(body) ? new Uint8Array(body.buffer, body.byteOffset, body.byteLength) : null;
      if (!bytes?.length || bytes.length > 65536) return;
      const videoId = new URL(location.href).searchParams.get('v');
      if (videoId) globalThis.__openVideoSabrRequest = { videoId, body: Array.from(bytes) };
    } catch {}
  }
  document.addEventListener('yt-navigate-start', () => { delete globalThis.__openVideoSabrRequest; });
  window.fetch = function (...args) {
    const address = args[0] instanceof Request ? args[0].url : args[0];
    if (args[1]?.body) rememberSabr(address, args[1].body);
    else if (args[0] instanceof Request && args[0].method === 'POST' && /^https:\/\/[^/]+\.googlevideo\.com\/videoplayback(?:\?|$)/.test(address)) {
      try { args[0].clone().arrayBuffer().then(body => rememberSabr(address, body)).catch(() => {}); } catch {}
    }
    const url = captionUrl(args[0] instanceof Request ? args[0].url : args[0]);
    const result = originalFetch.apply(this, args);
    if (url) result.then(response => {
      if (response.ok) response.clone().text().then(text => remember(url, text)).catch(() => {});
    }).catch(() => {});
    return result;
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  const xhrUrls = new WeakMap();
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    rememberSabr(xhrUrls.get(this), body);
    return originalSend.call(this, body);
  };
  XMLHttpRequest.prototype.open = function (method, value, ...rest) {
    xhrUrls.set(this, value);
    const url = captionUrl(value);
    if (url) this.addEventListener('load', () => {
      if (this.status === 200) {
        try { remember(url, this.responseType === 'json' ? JSON.stringify(this.response) : this.responseText); } catch {}
      }
    }, { once: true });
    return originalOpen.call(this, method, value, ...rest);
  };
})();
