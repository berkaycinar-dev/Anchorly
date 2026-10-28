**🌐 Language / Dil:** [English](README.md) | Türkçe

# Anchorly

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)
![Storage](https://img.shields.io/badge/Veri-Taray%C4%B1c%C4%B1da%20saklan%C4%B1r-orange)

Anchorly, React ile geliştirdiğim bir görev ve alışkanlık panosu. Günlük görevler, rutinler, takvim ve projeler tek yerde; verilerin tarayıcından dışarı çıkmaz.

**Canlı demo:** https://anchorly-nine.vercel.app/

| Panel (açık tema)                                          | Panel (koyu tema)                                         |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| ![Açık temada panel](docs/screenshots/dashboard-light.png) | ![Koyu temada panel](docs/screenshots/dashboard-dark.png) |
| **Bugün**                                                  | **Günlük Rutin**                                          |
| ![Bugün sayfası](docs/screenshots/today.png)               | ![Günlük rutin tablosu](docs/screenshots/routine.png)     |

![Takvim sayfası](docs/screenshots/calendar.png)

---

## Özellikler

- **7 sayfa:** Panel, Bugün, Günlük Rutin, Takvim, Arşiv, Projeler ve Ayarlar.
- **Panel:** karşılama mesajı, görev sayaçları (bugün, tamamlanan, devam eden, geciken), tamamlanma halkası ve haftalık verimlilik grafiği.
- **Görevler:** her görev için kategori ve tarih, arama, Tümü / Aktif / Tamamlanan filtreleri; açıklama, adımlar ve dosya eki (her biri en fazla 1 MB) içeren görev detay penceresi.
- **Tekrarlayan görevler:** günlük veya haftalık. Gelecek tekrarlar 120 gün ilerisine kadar üretilir.
- **Sürükle-bırak:** aktif görevlerin sırasını fareyle, dokunmatik ekranda uzun basarak ya da klavyeyle değiştirme.
- **Günlük Rutin:** aylık tabloda alışkanlık takibi, ay ay gezinme. Telefonda gün şeridi ve rutin kartları.
- **Takvim:** ay ve hafta görünümü, herhangi bir güne hızlı görev ekleme. Telefonda gün seçici ve ajanda listesi.
- **Arşiv:** tüm görevlerine göz at; duruma ve tarih aralığına göre filtrele.
- **Projeler:** görevleri bir proje altında toplama ve tek sayfadan yönetme.
- **Duyarlı tasarım:** 375 px telefondan masaüstüne kadar her ekranda çalışır: telefonda alt sekme çubuğu, tablette ikonlu kenar çubuğu, masaüstünde tam kenar çubuğu.
- **Sayfa adresleri:** her sayfanın kendi adresi var; tarayıcının geri tuşu ve yer imleri çalışır.
- **Kişiselleştirme:** 7 tema (gray, purple, blue, red, green, pink, black), Türkçe ve İngilizce, üç yazı tipi (Inter, Poppins, Manrope), haftanın Pazartesi ya da Pazar başlaması.
- **Klavye kısayolu:** yazı alanı dışındayken `n` tuşu Bugün sayfasına gidip yeni görev alanına odaklanır.
- **Doğru yerel tarih:** "bugün" yerel saat diliminize göre belirlenir ve gece yarısı kendiliğinden yenilenir.
- **Veri güvenliği:**
  - `localStorage` içindeki bozuk bir değer uygulamayı çökertmez. Değer `:corrupt` anahtarı altında saklanır ve uygulama varsayılanlara döner.
  - Tarayıcı depolaması dolduğunda ya da kullanılamadığında bir uyarı şeridi gösterilir.
  - Eski sürümlerin kaydettiği veriler (sayısal id'ler) açılışta otomatik olarak UUID'ye dönüştürülür.
- **Demo verisi:** ilk açılışta bugüne göre tarihlenmiş birkaç örnek görev gelir, böylece uygulama boş görünmez.

---

## Kullanılan teknolojiler

- React 19
- Vite 8
- React Router 8
- Sürükle-bırak için dnd-kit
- Vanilla CSS (UI kütüphanesi yok)
- Testler için Vitest ve Testing Library
- ESLint ve Prettier
- GitHub Actions (her push'ta lint, test ve derleme)

---

## Kurulum

Node.js 22 gerektirir (22.22.2 veya üstü önerilir).

```bash
git clone https://github.com/berkaycinar-dev/Anchorly.git
cd Anchorly
npm install
npm run dev
```

---

## Komutlar

| Komut                | Ne yapar                                    |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Geliştirme sunucusunu başlatır              |
| `npm run build`      | `dist/` içinde üretim derlemesi oluşturur   |
| `npm run preview`    | Üretim derlemesini yerelde sunar            |
| `npm run lint`       | ESLint çalıştırır                           |
| `npm test`           | Tüm testleri bir kez çalıştırır             |
| `npm run test:watch` | Testleri izleme modunda çalıştırır          |
| `npm run format`     | `src/` klasörünü Prettier ile biçimlendirir |

Testler saat dilimi `Europe/Istanbul` olarak sabitlenerek çalışır; böylece tarih mantığı yerel gece yarısı çevresinde test edilir.

---

## Klasör yapısı

```text
src/
├── components/     AddTaskForm, BottomNav, CalendarAgenda, DateField,
│                   Header, Logo, NavIcon, RoutineDayView, Sidebar,
│                   StatCard, StorageToasts, TaskDetailModal, TaskList,
│                   toast/ (ToastProvider)
├── constants/      initialData.js (demo veri), settings.js (temalar, varsayılanlar)
├── data/           DataProvider, useRepository, useRepositorySnapshot
│   ├── contracts/  her repository'nin geçmesi gereken sözleşme testleri
│   └── local/      localStorage repository'leri, migration'lar, depolama durumu
├── hooks/          useProjects, useRoutines, useSettings, useTasks,
│                   useToday
├── lib/            id.js
├── pages/          Dashboard, Today, DailyRoutine, Calendar,
│                   Archive, Projects, Settings
├── styles/         tokens.css (yedi tema), base, layout,
│                   components/, pages/
├── test/           test kurulumu ve örnek veriler
├── utils/          categoryHelpers, dateHelpers, routineStats, taskHelpers
├── App.jsx         Uygulama iskeleti, sayfa geçişi, DataProvider
├── routes.js       Sayfa yolları
├── strings.js      Türkçe ve İngilizce metinler
└── main.jsx        Giriş noktası, render öncesi veri göçlerini çalıştırır
```

---

## Bilinen sınırlamalar

- Veriler tarayıcıda (`localStorage`) saklanır. Cihazlar veya tarayıcılar arasında senkronize olmaz ve tarayıcı boyutunu sınırlar.
- Henüz kullanıcı hesabı yok. Backend ayrı bir depoda geliştiriliyor: [anchorly-api](https://github.com/berkaycinar-dev/anchorly-api).

---

## Yol haritası

- [x] React Router ile her sayfa için ayrı adres
- [x] Toast bildirimleri
- [x] GitHub Actions ile sürekli entegrasyon
- [x] Veri erişim katmanı: `DataProvider` arkasında repository'ler
- [x] Mobil görünüm
- [ ] Cihazlar arası veri için backend, veritabanı ve kimlik doğrulama (geliştiriliyor: [anchorly-api](https://github.com/berkaycinar-dev/anchorly-api))
- [ ] Klavye ve ekran okuyucu erişilebilirliği incelemesi
- [ ] Yüklenebilir web uygulaması (PWA) ve Android uygulaması

---

## Lisans

Bu proje kişisel ve portfolyo amaçlı geliştirilmiştir.

---

**Geliştiren:** [berkaycinar-dev](https://github.com/berkaycinar-dev)sssssssssssssssssss