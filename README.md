**🌐 Language / Dil:** English | [Türkçe](README.tr.md)

# Anchorly

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)
![Storage](https://img.shields.io/badge/Data-Stored%20in%20browser-orange)

Anchorly is a task and habit dashboard built with React. Daily tasks, routines, a calendar and projects live in one place, and your data never leaves your browser.

**Live demo:** https://anchorly-nine.vercel.app/

| Dashboard (light theme)                                         | Dashboard (dark theme)                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| ![Dashboard, light theme](docs/screenshots/dashboard-light.png) | ![Dashboard, dark theme](docs/screenshots/dashboard-dark.png) |
| **Today**                                                       | **Daily Routine**                                             |
| ![Today page](docs/screenshots/today.png)                       | ![Daily routine table](docs/screenshots/routine.png)          |

![Calendar page](docs/screenshots/calendar.png)

---

## Features

- **7 pages:** Dashboard, Today, Daily Routine, Calendar, Archive, Projects and Settings.
- **Dashboard:** greeting, task counters (today, completed, in progress, overdue), a completion donut and a weekly productivity chart.
- **Tasks:** category and date for each task, search, All / Active / Completed filters, and a detail dialog with description, steps and file attachments (up to 1 MB each).
- **Repeating tasks:** daily or weekly. Upcoming occurrences are generated 120 days ahead.
- **Drag and drop:** reorder active tasks with the mouse, by long-pressing on touch screens, or with the keyboard.
- **Daily Routine:** habit tracking in a monthly table with month navigation. On phones, a day strip with routine cards.
- **Calendar:** month and week views, with quick add on any day. On phones, a day picker with an agenda list.
- **Archive:** browse all your tasks and filter them by status and date range.
- **Projects:** group tasks under a project and manage them from one page.
- **Responsive layout:** works from 375 px phones to desktop screens: a bottom tab bar on phones, an icon sidebar on tablets and the full sidebar on desktop.
- **Page addresses:** every page has its own URL, so the browser's back button and bookmarks work.
- **Personalisation:** 7 themes (gray, purple, blue, red, green, pink, black), Turkish and English, three fonts (Inter, Poppins, Manrope), week starting on Monday or Sunday.
- **Keyboard shortcut:** press `n` outside a text field to jump to Today and focus the new task input.
- **Correct local dates:** "today" follows your local time zone and refreshes itself at midnight.
- **Data safety:**
  - A corrupt value in `localStorage` does not crash the app. It is kept under a `:corrupt` key and the app falls back to defaults.
  - A banner warns you when the browser storage is full or unavailable.
  - Data saved by older versions (numeric ids) is migrated to UUIDs automatically on startup.
- **Demo data:** on the first launch you get a few sample tasks dated relative to today, so the app is never empty.

---

## Tech stack

- React 19
- Vite 8
- React Router 8
- dnd-kit for drag and drop
- Vanilla CSS (no UI library)
- Vitest and Testing Library for tests
- ESLint and Prettier
- GitHub Actions (lint, tests and build on every push)

---

## Getting started

Requires Node.js 22 (22.22.2 or newer recommended).

```bash
git clone https://github.com/berkaycinar-dev/Anchorly.git
cd Anchorly
npm install
npm run dev
```

---

## Scripts

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

---

## Folder structure

```text
src/
├── components/     AddTaskForm, BottomNav, CalendarAgenda, DateField,
│                   Header, Logo, NavIcon, RoutineDayView, Sidebar,
│                   StatCard, StorageToasts, TaskDetailModal, TaskList,
│                   toast/ (ToastProvider)
├── constants/      initialData.js (demo data), settings.js (themes, defaults)
├── data/           DataProvider, useRepository, useRepositorySnapshot
│   ├── contracts/  contract tests every repository must pass
│   └── local/      localStorage repositories, migrations, storage status
├── hooks/          useProjects, useRoutines, useSettings, useTasks,
│                   useToday
├── lib/            id.js
├── pages/          Dashboard, Today, DailyRoutine, Calendar,
│                   Archive, Projects, Settings
├── styles/         tokens.css (the seven themes), base, layout,
│                   components/, pages/
├── test/           test setup and fixtures
├── utils/          categoryHelpers, dateHelpers, routineStats, taskHelpers
├── App.jsx         App shell, page switching, DataProvider
├── routes.js       Page paths
├── strings.js      Turkish and English texts
└── main.jsx        Entry point, runs data migrations before rendering
```

---

## Known limitations

- Data is stored in the browser (`localStorage`). It is not synced between devices or browsers, and the browser limits its size.
- There are no user accounts yet. The backend is being built in a separate repository: [anchorly-api](https://github.com/berkaycinar-dev/anchorly-api).

---

## Roadmap

- [x] A URL for every page with React Router
- [x] Toast notifications
- [x] Continuous integration with GitHub Actions
- [x] Data access layer: repositories behind a `DataProvider`
- [x] Mobile layout
- [ ] Backend, database and authentication for cross-device data (in progress: [anchorly-api](https://github.com/berkaycinar-dev/anchorly-api))
- [ ] Keyboard and screen reader accessibility review
- [ ] Installable web app (PWA) and Android app

---

## License

This project was built for personal and portfolio purposes.

---

**Developer:** [berkaycinar-dev](https://github.com/berkaycinar-dev)
