export const RELEASE_API = 'https://api.github.com/repos/EReaXe/ViTools/releases/latest';
export function parseVersion(text) {
  if (typeof text !== 'string' || !/^v?\d+(?:\.\d+){0,3}$/.test(text)) throw new Error('Geçersiz sürüm.');
  const parts = text.replace(/^v/, '').split('.').map(Number);
  if (parts.some(n => n > 65535)) throw new Error('Geçersiz sürüm.');
  while (parts.length < 4) parts.push(0); return parts;
}
export function isNewerVersion(latest, current) {
  const a = parseVersion(latest), b = parseVersion(current);
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}
export function readRelease(data, current) {
  if (!data || data.draft || data.prerelease) throw new Error('Kararlı sürüm bulunamadı.');
  parseVersion(data.tag_name);
  const version = data.tag_name.replace(/^v/, ''); const name = `vitools-${version}-chrome.zip`;
  const asset = data.assets?.find(a => a.name === name && a.size > 0 && a.state === 'uploaded');
  if (!asset) throw new Error('Chrome kurulum paketi henüz hazır değil.');
  const url = new URL(asset.browser_download_url);
  if (url.origin !== 'https://github.com' || url.pathname !== `/EReaXe/ViTools/releases/download/${encodeURIComponent(data.tag_name)}/${name}` || url.search || url.hash) throw new Error('İndirme kaynağı doğrulanamadı.');
  return { version, available: isNewerVersion(version, current), downloadUrl: url.href };
}
