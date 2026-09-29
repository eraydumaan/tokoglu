# Tokoğlu Ahşap

İstanbul'da özel ölçü mobilya tasarımı, üretimi ve montajı yapan Tokoğlu Ahşap'ın web sitesi. Proje örneklerini, hizmet sayfalarını ve teklif formunu içerir.

**Web sitesi:** [tokogluahsap.com](https://tokogluahsap.com)

## Proje hakkında

Site HTML, CSS ve JavaScript ile hazırlanır; Vite ile derlenir. İletişim formu, Vercel üzerinde çalışan bir Node.js fonksiyonu üzerinden Resend ile e-posta gönderir.

- Mutfak dolabı, banyo dolabı, gardırop, TV ünitesi ve ofis mobilyası sayfaları
- Kategori filtreli proje galerisi ve büyük görsel görünümü
- Mobil menü, iletişim bağlantıları ve teklif formu
- Google Analytics, yapılandırılmış veri, sitemap ve robots.txt

## Yerel kurulum

Node.js 22.12 veya üzeri ve npm gerekir. Proje Node.js 22.17.0 ile doğrulanmıştır.

```sh
git clone https://github.com/eraydumaan/tokoglu.git
cd tokoglu
npm ci
npm run dev
```

Terminalde gösterilen yerel adresi açın. Vite geliştirme sunucusu ön yüzü çalıştırır; `/api/contact` fonksiyonunu çalıştırmaz. Formun uçtan uca denenmesi için Vercel fonksiyonlarını çalıştıran bir ortam gerekir.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Ön yüz geliştirme sunucusunu başlatır. |
| `node --test` | İletişim endpoint'inin testlerini çalıştırır. |
| `npm run build` | Altı sayfayı ve varlıkları `dist/` dizinine derler. |
| `npm run preview` | Derlenmiş ön yüzü yerelde önizler; API'yi çalıştırmaz. |

Testler e-posta sağlayıcısını taklit eder; gerçek e-posta göndermez ve gerçek API anahtarı gerektirmez.

## Ortam değişkenleri

`.env.example` dosyasını yerel çalışma için `.env` adıyla kopyalayın. Vercel üzerinde değişkenleri ilgili Preview veya Production ortamına ayrıca ekleyin.

| Değişken | Kullanım |
| --- | --- |
| `RESEND_API_KEY` | E-posta göndermek için gereken sunucu anahtarı. Tarayıcı koduna veya Git'e eklenmemelidir. |
| `CONTACT_FROM` | Gönderen adresi. Üretimde Resend üzerinde doğrulanmış alan adına ait bir adres kullanın. |
| `ALLOWED_ORIGINS` | Virgülle ayrılmış ek form kaynakları; protokol ve varsa port dahil tam origin değerleri. |
| `VITE_GA_MEASUREMENT_ID` | Derleme sırasında ön yüze aktarılan Google Analytics ölçüm kimliği; gizli bilgi değildir. |

Üretim origin'leri `https://tokogluahsap.com` ve `https://www.tokogluahsap.com` kodda zaten izinlidir. `ALLOWED_ORIGINS` bu listeye ekleme yapar. Preview ortamında formu denemek için ilgili preview origin'ini bu değişkene ekleyin.

Form alıcısı `api/contact.js` içindeki `CONTACT_TO` sabitinde tanımlıdır. `CONTACT_FROM` belirtilmezse kod Resend'in `onboarding@resend.dev` adresini kullanır; üretim kurulumunda kendi gönderen adresinizi tanımlayın.

`.env`, `.env.*` ve `.vercel/` Git tarafından dışlanır; `.env.example` depoda tutulur. `VITE_` önekli değişkenler istemci paketine girebildiği için bu öneki sırlar için kullanmayın.

## İletişim formu

Ön yüz, `/api/contact` adresine JSON biçiminde `POST` isteği gönderir. Zorunlu alanlar:

| Alan | Üst sınır / kabul edilen değerler |
| --- | --- |
| `name` | 120 karakter |
| `phone` | 60 karakter |
| `city` | 120 karakter |
| `projectType` | `mutfak`, `yatak`, `tv`, `banyo`, `diger` |
| `message` | 2.000 karakter |

`company` alanı bot tuzağıdır; kullanıcı tarafından boş bırakılır. Alan doluysa endpoint e-posta göndermeden başarılı yanıt verir.

Endpoint origin ve içerik türünü, gövde boyutunu, zorunlu alanları ve kontrol karakterlerini doğrular. Gövde sınırı 16 KiB, IP başına sınır 60 saniyede 5 denemedir. E-posta sağlayıcısına yapılan istek 8 saniye ile sınırlandırılır; API yanıtları önbelleğe alınmaz.

Rate limit bellekte tutulur ve yalnızca çalışan instance için geçerlidir; dağıtık/global koruma sağlamaz. Origin kontrolü de kimlik doğrulama veya tek başına bot koruması değildir. Daha yoğun kötüye kullanım için merkezi rate limit ve bot doğrulaması ayrıca değerlendirilmelidir.

## Yayınlama

Vercel yapılandırması `vercel.json` dosyasındadır:

- Build komutu: `npm run build`
- Çıktı dizini: `dist`
- Sunucu fonksiyonu: `api/contact.js`
- Yönlendirmeler, URL rewrite kuralları ve güvenlik başlıkları: `vercel.json`

Yayın ortamında Resend anahtarını, gönderen adresini ve gerekiyorsa ek origin'leri tanımlayın. Ortam değişkenleri güncellendikten sonra değişikliklerin uygulanması için yeniden deploy edin.

Content Security Policy, script kaynaklarını sınırlar ve inline JavaScript çalıştırılmasına izin vermez. Yeni bir harici servis eklendiğinde gerekli CSP direktiflerini kontrol edin. Mevcut stiller için `style-src` içinde `unsafe-inline` izni bulunur.

## Dosya düzeni

```text
api/contact.js          İletişim formu sunucu fonksiyonu
js/main.js              Ön yüz etkileşimleri ve Analytics kurulumu
css/style.css           Site stilleri
index.html              Ana sayfa
banyo-dolabi/           Hizmet sayfası
mutfak-dolabi/          Hizmet sayfası
gardirop/               Hizmet sayfası
tv-unitesi/             Hizmet sayfası
ofis-mobilya/           Hizmet sayfası
images/                Proje fotoğrafları ve marka görselleri
public/                robots.txt ve sitemap.xml
tests/contact.test.js  Endpoint testleri
vite.config.cjs        Çok sayfalı build girişleri
vercel.json            Yayın ve HTTP başlıkları
```

## Değişiklik kontrolü

```sh
node --test
npm run build
git diff --check
```

Form değişikliklerinde geçerli gönderim, doğrulama hataları, bot tuzağı ve istek sınırını kontrol edin. Sayfa veya URL eklerken Vite girişlerini, sitemap'i ve ilgili yönlendirmeleri birlikte gözden geçirin.

Bağımlılık durumunu `npm audit`, yalnızca üretim bağımlılıklarını ise `npm audit --omit=dev` ile kontrol edebilirsiniz. Derlemenin başarılı olması bağımlılık güvenlik taramasının temiz olduğu anlamına gelmez.
