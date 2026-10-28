import { RELEASE_API, readRelease } from './update-core.js';
let pending;
async function check(force = false) {
  if (pending) return pending;
  pending = (async () => {
    const previous = (await chrome.storage.local.get('vitoolsUpdate')).vitoolsUpdate;
    const now = Date.now(), currentVersion = chrome.runtime.getManifest().version; let state;
    if (previous?.currentVersion === currentVersion && now - previous.checkedAt < (force ? 60000 : 43200000)) state = previous;
    else {
      try {
        const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (response.status === 404) state = { status: 'no-release', available: false };
        else {
          if (!response.ok) throw new Error(`GitHub yanıtı: ${response.status}. Daha sonra tekrar dene.`);
          state = { ...readRelease(await response.json(), currentVersion), status: 'ok' };
        }
      } catch (error) { state = { ...previous, status: 'error', error: error.message }; }
      state.checkedAt = now; state.currentVersion = currentVersion; await chrome.storage.local.set({ vitoolsUpdate: state });
    }
    await chrome.action.setBadgeText({ text: state.available ? '!' : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#e79b25' });
    await chrome.action.setTitle({ title: state.available ? `ViTools ${state.version} hazır` : 'ViTools' });
    return state;
  })();
  try { return await pending; } finally { pending = null; }
}
export function initUpdates() {
  const schedule = async () => { if (!(await chrome.alarms.get('vitools-update-check'))) await chrome.alarms.create('vitools-update-check', { periodInMinutes: 720 }); };
  chrome.runtime.onInstalled.addListener(() => { void schedule().then(() => check(true)).catch(() => {}); });
  chrome.runtime.onStartup.addListener(() => { void schedule().then(() => check()).catch(() => {}); });
  chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'vitools-update-check') void check().catch(() => {}); });
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.type !== 'check-update') return;
    if (sender.tab || sender.id !== chrome.runtime.id) { reply({ status: 'error', error: 'Geçersiz istek.' }); return; }
    check(Boolean(message.force)).then(reply, error => reply({ status: 'error', error: error.message })); return true;
  });
  void schedule().catch(() => {});
}
