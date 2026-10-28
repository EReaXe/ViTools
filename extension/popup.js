const select = document.querySelector('#placement');
chrome.storage.local.get({ placement: 'player' }).then(settings => { select.value = settings.placement; });
select.addEventListener('change', () => chrome.storage.local.set({ placement: select.value }));
document.querySelector('#version').textContent = `v${chrome.runtime.getManifest().version} · MIT · Açık kaynak`;
const status = document.querySelector('#update-status'), check = document.querySelector('#check-update'), download = document.querySelector('#download-update');
async function checkUpdate(force = false) {
  check.disabled = true; download.hidden = true; status.textContent = 'Sürüm kontrol ediliyor…';
  try {
    const result = await chrome.runtime.sendMessage({ type: 'check-update', force });
    if (result?.status === 'error') { status.textContent = `Kontrol yapılamadı: ${result.error}`; return; }
    if (result?.status === 'no-release') { status.textContent = 'Henüz yayımlanmış sürüm yok.'; return; }
    status.textContent = result?.available ? `ViTools ${result.version} hazır.` : 'En güncel sürümü kullanıyorsun.';
    if (result?.available && /^https:\/\/github\.com\/EReaXe\/ViTools\/releases\/download\//.test(result.downloadUrl)) { download.href = result.downloadUrl; download.hidden = false; }
  } catch { status.textContent = 'Kontrol yapılamadı. İnternet bağlantını kontrol et.'; }
  finally { check.disabled = false; }
}
check.addEventListener('click', () => checkUpdate(true)); void checkUpdate();
