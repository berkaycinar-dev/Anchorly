
# Anchorly

*[English](#english) | [Türkçe](#türkçe)*

---

## English

A React-based task and habit management dashboard for tracking daily tasks and habits in one place.

**Live demo:** _Coming soon_

### Features

- **Dashboard** — a circular chart showing total/completed/in-progress task counts and daily completion rate
- **Today (Today's Tasks)** — add, delete, and mark tasks as complete
  - Search by title
  - Filter by All / Active / Completed
  - Category (Work, Personal, Personal Development, Other) and date for each task
- **Daily Routine** — habit tracking in a monthly calendar view, navigate month by month, add/delete new routines
- **Dark Mode** — light/dark theme toggle
- **Persistent data** — all task and routine data is stored in the browser's `localStorage`, so nothing is lost on page refresh

### Tech Stack

- React 19
- Vite
- Vanilla CSS (no UI library used)

### Installation

```bash
git clone https://github.com/berkaycinar-dev/anchorly.git
cd anchorly
npm install
npm run dev
```

### Folder Structure

```
src/
├── components/
│   ├── AddTaskForm.jsx    # New task form
│   ├── Header.jsx         # Top bar, dark mode toggle
│   ├── Sidebar.jsx        # Page navigation
│   ├── Statcard.jsx       # Dashboard stat card
│   └── TaskList.jsx       # Task list
├── App.jsx                # Main state and page routing logic
└── main.jsx
```

### Known Gaps / Ongoing Development

The project is under active development. Pages currently visible in the sidebar but not yet functional:

- [ ] Calendar
- [ ] Archive
- [ ] Projects
- [ ] Settings

### Roadmap

- [ ] Complete the tabs listed above
- [ ] Backend + database integration (persistent, cross-device data instead of localStorage)
- [ ] User login / authentication
- [ ] Task prioritization and reminders
- [ ] Mobile-responsive design improvements

### Screenshots

_Screenshots coming soon_

### License

This project was built for personal/portfolio purposes.

---

**Developer:** [berkaycinar-dev](https://github.com/berkaycinar-dev)

---
---

## Türkçe
=======


```bash

git clone https://github.com/berkaycinar-dev/anchorly.git
cd anchorly
npm install
npm run dev
```


### Klasör Yapısı

```
src/
├── components/
│   ├── AddTaskForm.jsx    # Yeni görev ekleme formu
│   ├── Header.jsx         # Üst bar, dark mode toggle
│   ├── Sidebar.jsx        # Sayfa navigasyonu
│   ├── Statcard.jsx       # Dashboard istatistik kartı
│   └── TaskList.jsx       # Görev listesi
├── App.jsx                # Ana state ve sayfa yönlendirme mantığı
└── main.jsx
```

### Bilinen Eksikler / Devam Eden Geliştirme

Proje aktif geliştirme aşamasında. Şu an sidebar'da görünüp henüz işlevsel olmayan sayfalar:

- [ ] Calendar
- [ ] Archive
- [ ] Projects
- [ ] Settings

### Yol Haritası

- [ ] Yukarıdaki sekmelerin tamamlanması
- [ ] Backend + veritabanı entegrasyonu (localStorage yerine kalıcı, cihazlar arası senkronize veri)
- [ ] Kullanıcı girişi / kimlik doğrulama
- [ ] Görev önceliklendirme ve hatırlatıcılar
- [ ] Mobil uyumlu (responsive) tasarım iyileştirmeleri

### Ekran Görüntüsü

_Ekran görüntüleri yakında eklenecek_

### Lisans

Bu proje kişisel/portfolyo amaçlı geliştirilmiştir.

---

**Geliştiren:** [berkaycinar-dev](https://github.com/berkaycinar-dev)

