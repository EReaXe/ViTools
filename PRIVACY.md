# Gizlilik

Eklenti, kullanıcının başlattığı işlemler için YouTube sayfasındaki video bilgilerini ve medya kaynaklarını kullanır. İstekler YouTube ve Google'ın medya/görsel sunucularına yapılır. Geliştiriciye ait sunucu, analitik, reklam veya telemetri bulunmaz. Ayrıca GitHub API'deki EReaXe/ViTools son sürüm uç noktasına 12 saatte bir güncelleme kontrolü yapılır. Bu isteğe video bilgileri veya hesap çerezleri eklenmez; bağlantı nedeniyle GitHub normal ağ bilgilerini (ör. IP adresi) görebilir. Son kontrol zamanı ve sürüm sonucu cihazda saklanır.

Konum tercihi chrome.storage.local içinde cihazda saklanır. İndirilen dosyalar tarayıcının indirme mekanizmasıyla kullanıcının cihazına kaydedilir. Altyazılar, medya verileri ve mevcut videoya ait yayın doğrulama bilgisi işlem için bellekte tutulur; geliştiriciye gönderilmez ve eklenti tarafından diske kaydedilmez. Bellekteki bazı dosya URL'leri kaynakları serbest bırakmak için kısa süre sonra iptal edilir. Sekme kapanınca sekme belleği temizlenir.

## İzinler

- storage: araç çubuğunun konum tercihini saklar.
- alarms: periyodik güncelleme kontrolünü zamanlar.
- api.github.com/repos/EReaXe/ViTools/releases/latest: yalnızca son kararlı sürüm bilgisini okur.
- downloads: video ve küçük resim dosyalarının kaydını başlatır. MP3 ve bazı diğer çıktılar dosya bağlantısıyla kaydedilir.
- scripting: açık YouTube sekmesinin oynatıcı bilgilerini okur ve kullanıcı işlemlerini yürütür.
- https://www.youtube.com/*: içerik arayüzü, altyazılar, oynatıcı bilgileri ve oynatıcı koduna erişir.

Eklenti YouTube oturumuyla ilişkili sayfa verileriyle çalışabilir; ayrı bir giriş ekranı veya parola toplama işlemi yoktur. cookies izni istenmez. Kod bağımlılıkları pakete dahildir; CDN'den kütüphane yüklenmez. Video URL'lerini çözümlemek için YouTube'un güncel oynatıcı kodu okunur ve yorumlanır.
