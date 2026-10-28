# Katkıda bulunma

Node.js 24 veya daha yeni bir sürüm önerilir. Paketlenmiş bağımlılıklar bulunduğundan eklentiyi kullanmak veya temel kontrolleri çalıştırmak için npm kurulumu gerekmez.

1. README.md içindeki adımlarla extension klasörünü Chrome'a yükleyin.
2. Değişiklikleri yaptıktan sonra `node scripts/test.mjs` çalıştırın.
3. Chrome'da eklentiyi yeniden yükleyin ve YouTube sekmesini yenileyin.
4. Etkilenen işlevi ve YouTube içi video geçişlerini deneyin. Kontrol edilmeyen tarayıcı davranışlarını doğrulanmış gibi raporlamayın.

Gerçek medya ile birleştirme kontrolleri için `node scripts/test-mux.mjs DOSYA mp4` veya `webm` kullanılır. README.md içindeki CC0 örnekleri kullanılabilir. Örnek indirmeleri ve YouTube canlı denemeleri temel test komutunun parçası değildir.

SABR bağımlılığını yeniden paketlemek için `npm install`, ardından `npm run build:stream` kullanılır. Diğer paketlenen bileşenlerin sürümleri ve kaynak bağlantıları extension/vendor/README.md içinde yer alır. Üçüncü taraf lisanslarını koruyun.

Katkılar projenin MIT lisansı kapsamında sunulur. Hata bildirirken tarayıcı sürümünü, adımları ve hata mesajını belirtin. İmzalı medya URL'leri, yayın doğrulama bilgileri veya hesap çerezlerini paylaşmayın.
