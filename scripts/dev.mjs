import { watch } from 'node:fs';
console.log('extension/ izleniyor. Değişikliklerden sonra chrome://extensions üzerinden Yeniden yükle, ardından YouTube sekmesini yenile.');
watch(new URL('../extension/', import.meta.url), { recursive: true }, (_, file) => console.log(`${new Date().toLocaleTimeString('tr-TR')} — ${file} değişti; eklentiyi ve sayfayı yenile.`));
