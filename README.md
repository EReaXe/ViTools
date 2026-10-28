# ViTools

Chrome ve Chromium tabanlı tarayıcılar için MIT lisanslı Manifest V3 eklentisi. İlk deneme sürümü: 0.1.0.

## Kurulum

chrome://extensions sayfasında Geliştirici modunu açın ve Paketlenmemiş öğe yükle ile extension klasörünü seçin. Kod değiştikten sonra eklentiyi yeniden yükleyip YouTube sayfasını yenileyin.

Node.js 24 ile kontrol edildi. Harici paket kurulumu veya derleme gerekmez; bağımlılıklar extension/vendor içinde paketlenmiştir.

## İşlevler

- Video: birleşik sesli MP4/WebM dosyaları ve ayrı yüksek kalite akışları. MP4 için AVC/AAC; WebM için VP9 veya AV1 ile Opus desteklenir. Videonun sunduğu kaliteler listelenir; çözünürlük yükseltme yapılmaz. Ayrı akışlar yeniden kodlanmadan birleştirilir; indirme ilerlemesi gösterilir.
- Küçük resimler: mevcut çözünürlükler, önizleme ve JPG indirme.
- Ekran görüntüsü: geçerli kareyi özgün çözünürlükte PNG/JPEG kaydetme ve kareyi yenileme.
- Altyazılar: mevcut diller, otomatik altyazılar ve SRT/WebVTT. Gerekirse YouTube oynatıcısında ilgili dili açın.
- MP3: yalnızca ses akışını indirme (doğrudan ve SABR), başlangıç/bitiş aralığı, 128/192/256/320 kbps, oynatıcıdan başlangıç alma ve ilerleme göstergesi. Ses Chrome'un çözücüsüyle çözülür ve yerel LAME JavaScript kodlayıcısıyla MP3'e dönüştürülür. İşlem için menüyü açık tutun. Seçili aralık dönüştürülür; bu ilk sürümde kaynak sesin tamamı indirilir. Mono/stereo desteklenir. Yüksek bit hızı kaynak sesin kalitesini yükseltmez.

## Sınırlar

Yüksek kalite için görüntü ve ses toplamı en fazla 512 MB; birleşik doğrudan video indirme için sınır 256 MB. Dosyalar bellekte işlenir; indirme/birleştirme sırasında sekmeyi kapatmayın. Video değişirse yüksek kalite indirmesi durdurulur. Boş, metin veya kısmi medya yanıtları kaydedilmez.

URL n/imza dönüşümü yerel youtubei.js ve Sval ile yapılır. URL sunulmayan yüksek kaliteler için googlevideo 5.0.1 ile SABR yayın yolu eklendi. Mevcut videonun oynatıcı yapılandırması ve varsa oynatıcının yüklediği yayın doğrulama bilgisi yalnızca sekme belleğinde kullanılır. Videoyu birkaç saniye oynatmak gerekebilir. PO-token üretimi, DRM ve canlı yayın desteği yoktur. Bazı videolar 403 verebilir. YouTube değişiklikleri bakım gerektirebilir.

## Kontroller

- node scripts/check.mjs
- node scripts/test-subtitles.mjs
- node scripts/test-decipher.mjs
- node scripts/test-adaptive.mjs
- node scripts/test-media-url.mjs
- node scripts/test-sabr.mjs
- node scripts/test-mp3.mjs
- node scripts/test-mux.mjs SESLI_ORNEK_DOSYA mp4 (veya webm)
- node scripts/probe-player.mjs (canlı YouTube oynatıcı testi; ağ gerekir)
- node scripts/dev.mjs (değişiklik izleme)

Beş temel işlev ve yüksek kalite indirme kullanıcı tarafından Chrome üzerinde çalışır olarak doğrulandı. Ayrı olarak gerçek MP4/WebM dosyalarının birleştirilmesi ve dört bit hızında MP3 oluşturma test edildi. Bu kontroller tüm videolar veya tüm Chromium tarayıcı sürümleri için uyumluluk garantisi değildir.

Test örnekleri: https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4 ve flower.webm. Örnekler eklentinin parçası değildir.

## Arayüz ve gizlilik

Araç çubuğu oynatıcının altında sağda yer alır; başlığı aşağı itmez. Eklenti menüsünden Abone ol yanına taşınabilir. Paneller sayfanın üzerinde açılır. Konum tercihi yerel depolamada tutulur. Harici indirme servisi veya yardımcı program kullanılmaz. İmzalı URL'ler diske kaydedilmez.

## Açık kaynak

Projenin özgün kodu MIT lisanslıdır; LICENSE dosyasına bakın. Paketlenen bileşenlerin kendi lisansları geçerlidir. Sürümler ve kaynak bağlantıları extension/vendor/README.md içinde bulunur. Mediabunny MPL-2.0; LAME/lamejs LGPL; youtubei.js, Sval ve googlevideo MIT; protobuf Apache-2.0/BSD-3-Clause lisanslıdır. Üçüncü taraf lisans metinleri korunmalıdır.

## Sürüm paketleri

`node scripts/test.mjs` tüm yerel temel kontrolleri çalıştırır. `node scripts/package.mjs` kontrolleri yeniden çalıştırıp dist klasöründe kurulum ZIP'i, kaynak kod ZIP'i ve SHA256SUMS.txt oluşturur. Harici test dosyaları, araştırma klasörü ve geliştirme bağımlılıkları paketlere girmez. Chrome ZIP'ini bir klasöre çıkarıp manifest.json bulunan klasörü yükleyin. Bu işlem mağaza yayını yapmaz.

Gizlilik ve izin açıklamaları PRIVACY.md; katkı adımları CONTRIBUTING.md; sürüm notları CHANGELOG.md içindedir.

