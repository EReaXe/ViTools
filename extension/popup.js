const select = document.querySelector('#placement');
chrome.storage.local.get({ placement: 'player' }).then(settings => { select.value = settings.placement; });
select.addEventListener('change', () => chrome.storage.local.set({ placement: select.value }));
