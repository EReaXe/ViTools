# ViTools ve Chrome Web Store

28 Ekim 2026 tarihinde resmi belgeler kontrol edildi.

## Mevcut sürümün durumu

Bu sürüm Chrome Web Store'a uygun olarak sunulmamalıdır. Google'ın ihlal rehberi, YouTube videosu indirmeyi kolaylaştırmayı yasak ürünler kapsamında ret nedenleri arasında açıkça listeler. Ayrıca video-decipher.js, YouTube'dan alınan oynatıcı kodunu Sval ile yorumlar; Manifest V3 politikası uzaktaki mantığı yorumlayıcıyla çalıştırmayı da sınırlar. Bunlar yalnızca ZIP yükleyerek çözülecek sorunlar değildir. İşlevleri gizlemek veya inceleme sırasında devre dışı bırakmak uygun bir çözüm değildir.

Kaynak ve yerel yükleme ZIP'i GitHub üzerinden paylaşılabilir. Yerel kurulum için ZIP'i çıkarıp chrome://extensions sayfasından Geliştirici modu > Paketlenmemiş öğe yükle yolunu kullanın.

## Mağaza için uygun bir sürüm hazırlandığında

1. Chrome Web Store Developer Dashboard'a Google hesabıyla kaydolun. Hesapta iki adımlı doğrulamayı açın; geliştirici kaydı için tek seferlik ücret vardır. Geçerli tutarı kayıt ekranında kontrol edin.
2. Politikaya uygun işlevleri ve izinleri belirleyin. Mağaza sürümünün kodu, açıklaması ve gerçek davranışı birbiriyle tutarlı olmalıdır.
3. Manifest simgelerini, mağaza simgesini ve ekran görüntülerini hazırlayın. Gizlilik metnini herkese açık bir URL'de yayınlayın.
4. Manifest.json kökte olan kurulum ZIP'ini Add new item ile yükleyin. Tam kaynak kod ZIP'i mağaza yükleme paketi değildir.
5. Store listing bölümüne ad, açıklama, kategori ve görselleri girin.
6. Privacy bölümünde tek amacı, veri kullanımını, izin gerekçelerini ve uzaktan kod durumunu doğru beyan edin. Gerekli test adımlarını ekleyin.
7. Distribution bölümünden görünürlüğü ve bölgeleri seçip incelemeye gönderin. Liste dışı veya özel görünürlük politika muafiyeti değildir.
8. Sonraki güncellemelerde manifest sürümünü artırın ve yeni ZIP yükleyin.

Bu depoda mağazaya gönderme, ödeme veya mağaza onayı işlemi yapılmamıştır.

## Resmi kaynaklar

- https://developer.chrome.com/docs/webstore/troubleshooting#prohibited-products
- https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements
- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/publish
- https://chrome.google.com/webstore/devconsole
