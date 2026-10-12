# Anchorly

_[English](#english) | [Türkçe](#türkçe)_

---

## English

Anchorly is a task and habit dashboard built with React. Daily tasks, routines, a calendar and projects live in one place, and your data never leaves your browser.

**Live demo:** https://anchorly-nine.vercel.app/

| Dashboard (light theme)                                         | Dashboard (dark theme)                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| ![Dashboard, light theme](docs/screenshots/dashboard-light.png) | ![Dashboard, dark theme](docs/screenshots/dashboard-dark.png) |
| **Today**                                                       | **Daily Routine**                                             |
| ![Today page](docs/screenshots/today.png)                       | ![Daily routine table](docs/screenshots/routine.png)          |

![Calendar page](docs/screenshots/calendar.png)

### Features

- **7 pages:** Dashboard, Today, Daily Routine, Calendar, Archive, Projects and Settings.
- **Dashboard:** greeting, task counters (today, completed, in progress, overdue), a completion donut and a weekly productivity chart.
- **Tasks:** category and date for each task, search, All / Active / Completed filters, and a detail dialog with description, steps and file attachments (up to 1 MB each).
- **Repeating tasks:** daily or weekly. Upcoming occurrences are generated 120 days ahead.
- **Drag and drop:** reorder active tasks by dragging.
- **Daily Routine:** habit tracking in a monthly table with month navigation.
- **Calendar:** month and week views, with quick add on any day.
- **Archive:** browse all your tasks and filter them by status and date range.
- **Projects:** group tasks under a project and manage them from one page.
- **Personalisation:** 6 themes (gray, purple, blue, red, green, pink), Turkish and English, three fonts (Inter, Poppins, Manrope), week starting on Monday or Sunday.
- **Keyboard shortcut:** press `n` outside a text field to jump to Today and focus the new task input.
- **Correct local dates:** "today" follows your local time zone and refreshes itself at midnight.
- **Data safety:**
  - A corrupt value in `localStorage` does not crash the app. It is kept under a `:corrupt` key and the app falls back to defaults.
  - A banner warns you when the browser storage is full or unavailable.
  - Data saved by older versions (numeric ids) is migrated to UUIDs automatically on startup.
- **Demo data:** on the first launch you get a few sample tasks dated relative to today, so the app is never empty.

### Tech stack

- React 19
- Vite 8
- Vanilla CSS (no UI library)
- Vitest and Testing Library for tests
- ESLint and Prettier

### Getting started

Requires Node.js 22 (22.22.2 or newer recommended).

```bash
git clone https://github.com/berkaycinar-dev/Anchorly.git
cd Anchorly
npm install
npm run dev
```

### Scripts

| Command              | What it does                         |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the development server         |
| `npm run build`      | Create a production build in `dist/` |
| `npm run preview`    | Serve the production build locally   |
| `npm run lint`       | Run ESLint                           |
| `npm test`           | Run all tests once                   |
| `npm run test:watch` | Run tests in watch mode              |
| `npm run format`     | Format `src/` with Prettier          |

Tests run with the time zone fixed to `Europe/Istanbul`, so date logic is tested around local midnight.

### Folder structure

```
src/
├── components/     AddTaskForm, Header, NavIcon, Sidebar, StatCard,
│                   StorageWarning, TaskDetailModal, TaskList
├── constants/      initialData.js (demo data factory)
├── hooks/          useLocalStorageState, useProjects, useRoutines,
│                   useTasks, useToday
├── lib/            id.js, migrations.js, storageStatus.js
├── pages/          Dashboard, Today, DailyRoutine, Calendar,
│                   Archive, Projects, Settings
├── test/           test setup and fixtures
├── utils/          dateHelpers.js, taskHelpers.js
├── App.jsx         App state and page switching
├── App.css         Styles and the six themes
├── strings.js      Turkish and English texts
└── main.jsx        Entry point, runs data migrations before rendering
```

### Known limitations

- Data is stored in the browser (`localStorage`). It is not synced between devices or browsers, and the browser limits its size.
- There is no mobile layout yet. The interface is designed for desktop screens.
- Pages do not have their own URLs yet. The address bar stays the same while you navigate.

### Roadmap

- [ ] A URL for every page with React Router
- [ ] Keyboard and screen reader accessibility, toast notifications
- [ ] Continuous integration with GitHub Actions
- [ ] State refactor with Context and reducers
- [ ] Mobile layout
- [ ] Backend, database and authentication for cross-device data

### License

This project was built for personal and portfolio purposes.

---

**Developer:** [berkaycinar-dev](https://github.com/berkaycinar-dev)

---

---

## Türkçe

Anchorly, React ile geliştirdiğim bir görev ve alışkanlık panosu. Günlük görevler, rutinler, takvim ve projeler tek yerde; verilerin tarayıcından dışarı çıkmaz.

**Canlı demo:** https://anchorly-nine.vercel.app/

| Panel (açık tema)                                          | Panel (koyu tema)                                         |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| ![Açık temada panel](docs/screenshots/dashboard-light.png) | ![Koyu temada panel](docs/screenshots/dashboard-dark.png) |
| **Bugün**                                                  | **Günlük Rutin**                                          |
| ![Bugün sayfası](docs/screenshots/today.png)               | ![Günlük rutin tablosu](docs/screenshots/routine.png)     |

![Takvim sayfası](docs/screenshots/calendar.png)

### Özellikler

- **7 sayfa:** Panel, Bugün, Günlük Rutin, Takvim, Arşiv, Projeler ve Ayarlar.
- **Panel:** karşılama mesajı, görev sayaçları (bugün, tamamlanan, devam eden, geciken), tamamlanma halkası ve haftalık verimlilik grafiği.
- **Görevler:** her görev için kategori ve tarih, arama, Tümü / Aktif / Tamamlanan filtreleri; açıklama, adımlar ve dosya eki (her biri en fazla 1 MB) içeren görev detay penceresi.
- **Tekrarlayan görevler:** günlük veya haftalık. Gelecek tekrarlar 120 gün ilerisine kadar üretilir.
- **Sürükle-bırak:** aktif görevlerin sırasını sürükleyerek değiştirme.
- **Günlük Rutin:** aylık tabloda alışkanlık takibi, ay ay gezinme.
- **Takvim:** ay ve hafta görünümü, herhangi bir güne hızlı görev ekleme.
- **Arşiv:** tüm görevlerine göz at; duruma ve tarih aralığına göre filtrele.
- **Projeler:** görevleri bir proje altında toplama ve tek sayfadan yönetme.
- **Kişiselleştirme:** 6 tema (gray, purple, blue, red, green, pink), Türkçe ve İngilizce, üç yazı tipi (Inter, Poppins, Manrope), haftanın Pazartesi ya da Pazar başlaması.
- **Klavye kısayolu:** yazı alanı dışındayken `n` tuşu Bugün sayfasına gidip yeni görev alanına odaklanır.
- **Doğru yerel tarih:** "bugün" yerel saat diliminize göre belirlenir ve gece yarısı kendiliğinden yenilenir.
- **Veri güvenliği:**
  - `localStorage` içindeki bozuk bir değer uygulamayı çökertmez. Değer `:corrupt` anahtarı altında saklanır ve uygulama varsayılanlara döner.
  - Tarayıcı depolaması dolduğunda ya da kullanılamadığında bir uyarı şeridi gösterilir.
  - Eski sürümlerin kaydettiği veriler (sayısal id'ler) açılışta otomatik olarak UUID'ye dönüştürülür.
- **Demo verisi:** ilk açılışta bugüne göre tarihlenmiş birkaç örnek görev gelir, böylece uygulama boş görünmez.

### Kullanılan teknolojiler

- React 19
- Vite 8
- Vanilla CSS (UI kütüphanesi yok)
- Testler için Vitest ve Testing Library
- ESLint ve Prettier

### Kurulum

Node.js 22 gerektirir (22.22.2 veya üstü önerilir).

```bash
git clone https://github.com/berkaycinar-dev/Anchorly.git
cd Anchorly
npm install
npm run dev
```

### Komutlar

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

### Klasör yapısı

```
src/
├── components/     AddTaskForm, Header, NavIcon, Sidebar, StatCard,
│                   StorageWarning, TaskDetailModal, TaskList
├── constants/      initialData.js (demo veri üreticisi)
├── hooks/          useLocalStorageState, useProjects, useRoutines,
│                   useTasks, useToday
├── lib/            id.js, migrations.js, storageStatus.js
├── pages/          Dashboard, Today, DailyRoutine, Calendar,
│                   Archive, Projects, Settings
├── test/           test kurulumu ve örnek veriler
├── utils/          dateHelpers.js, taskHelpers.js
├── App.jsx         Uygulama durumu ve sayfa geçişi
├── App.css         Stiller ve altı tema
├── strings.js      Türkçe ve İngilizce metinler
└── main.jsx        Giriş noktası, render öncesi veri göçlerini çalıştırır
```

### Bilinen sınırlamalar

- Veriler tarayıcıda (`localStorage`) saklanır. Cihazlar veya tarayıcılar arasında senkronize olmaz ve tarayıcı boyutunu sınırlar.
- Henüz mobil görünüm yok. Arayüz masaüstü ekranlar için tasarlandı.
- Sayfaların henüz kendi adresi yok. Gezinirken adres çubuğu değişmez.

### Yol haritası

- [ ] React Router ile her sayfa için ayrı adres
- [ ] Klavye ve ekran okuyucu erişilebilirliği, toast bildirimleri
- [ ] GitHub Actions ile sürekli entegrasyon
- [ ] Context ve reducer'lar ile durum yönetimi düzenlemesi
- [ ] Mobil görünüm
- [ ] Cihazlar arası veri için backend, veritabanı ve kimlik doğrulama

### Lisans

Bu proje kişisel ve portfolyo amaçlı geliştirilmiştir.

---

**Geliştiren:** [berkaycinar-dev](https://github.com/berkaycinar-dev)