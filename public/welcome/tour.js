// Interactive app preview on the landing page. Shared by both languages.
// Uses classes only (the site's CSP blocks inline styles); progress bar
// widths are set through the CSSOM, which CSP allows.
(function () {
  "use strict";

  const root = document.getElementById("tour");
  if (!root) {
    return;
  }

  const STRINGS = {
    tr: {
      tabsLabel: "Önizlenecek sayfa",
      themesLabel: "Önizleme teması",
      tryTheme: "Temayı dene:",
      themes: {
        gray: "Gri",
        purple: "Mor",
        blue: "Mavi",
        red: "Kırmızı",
        green: "Yeşil",
        pink: "Pembe",
        black: "Siyah",
      },
      tabs: {
        today: "Bugün",
        routine: "Günlük Rutin",
        calendar: "Takvim",
        archive: "Arşiv",
      },
      nav: {
        dashboard: "Panel",
        projects: "Projeler",
        settings: "Ayarlar",
        routineShort: "Rutin",
        more: "Diğer",
      },
      signIn: "Giriş yap",
      signUp: "Kayıt ol",
      categories: {
        work: "İş",
        personal: "Kişisel",
        growth: "Kişisel Gelişim",
        health: "Sağlık",
      },
      today: {
        meta: "4 açık görev · 2 tamamlandı",
        addPlaceholder: "Yeni görev ekle...",
        open: "Tamamlanmamış",
        done: "Tamamlanmış",
        tasks: [
          "Rapor taslağını bitir",
          "Market alışverişi",
          "React notlarını gözden geçir",
          "Faturayı öde",
        ],
        doneTasks: ["Sabah e-postalarını yanıtla", "Spor çantasını hazırla"],
        detail: "Görev detayı",
        rows: [
          ["Durum", "Bekliyor"],
          ["Tarih", "6 Kasım"],
          ["Kategori", "İş"],
          ["Not", "Giriş ve grafikleri ekle"],
        ],
      },
      days: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
      routine: {
        range: "2 – 8 Kasım",
        items: [
          ["Su iç", "Bu ay 5/6"],
          ["Kitap oku", "Bu ay 4/6"],
          ["Yürüyüş", "Bu ay 5/6"],
        ],
      },
      calendar: {
        month: "Kasım 2026",
        items: {
          3: ["Müşteri toplantısı"],
          6: ["Rapor taslağını bitir", "Market alışverişi"],
          9: ["Sunum hazırla"],
          12: ["Fatura", "Ders notları"],
          17: ["Proje teslimi"],
          20: ["Kod gözden geçir", "Alışveriş"],
          24: ["Randevu"],
          27: ["Haftalık plan", "Okuma"],
        },
        pct: { 3: "%100", 6: "%33" },
        selected: "Seçili gün",
        hide: "Paneli gizle",
        dayTitle: "6 Kasım, Cuma",
        dayMeta: "6 görev · 2 tamamlandı",
        addPlaceholder: "6 Kasım için görev ekle...",
      },
      archive: {
        meta: "Tekrarlı seriler",
        oneTime: "Tek seferlik",
        series: "Tekrarlı seriler",
        stats: [
          ["Aktif seri", "3"],
          ["Bugün bekleyen", "2"],
          ["Genel tamamlama", "%71"],
        ],
        items: [
          [
            "Haftalık plan",
            "work",
            "Her Pazartesi · 12 tekrar",
            8,
            12,
            "Sonraki: 9 Kasım",
          ],
          [
            "Faturaları kontrol et",
            "personal",
            "Her Cuma · 6 tekrar",
            5,
            6,
            "Sonraki: Bugün",
          ],
          [
            "Sulama günü",
            "health",
            "Her gün · 20 tekrar",
            14,
            20,
            "Sonraki: Bugün",
          ],
        ],
        progress: (done, total) => done + " / " + total + " yapıldı",
      },
    },
    en: {
      tabsLabel: "Page to preview",
      themesLabel: "Preview theme",
      tryTheme: "Try a theme:",
      themes: {
        gray: "Gray",
        purple: "Purple",
        blue: "Blue",
        red: "Red",
        green: "Green",
        pink: "Pink",
        black: "Black",
      },
      tabs: {
        today: "Today",
        routine: "Daily Routine",
        calendar: "Calendar",
        archive: "Archive",
      },
      nav: {
        dashboard: "Dashboard",
        projects: "Projects",
        settings: "Settings",
        routineShort: "Routine",
        more: "More",
      },
      signIn: "Sign in",
      signUp: "Sign up",
      categories: {
        work: "Work",
        personal: "Personal",
        growth: "Self Development",
        health: "Health",
      },
      today: {
        meta: "4 open tasks · 2 done",
        addPlaceholder: "Add a new task...",
        open: "To do",
        done: "Completed",
        tasks: [
          "Finish the report draft",
          "Grocery shopping",
          "Review React notes",
          "Pay the bill",
        ],
        doneTasks: ["Answer morning emails", "Pack the gym bag"],
        detail: "Task details",
        rows: [
          ["Status", "Pending"],
          ["Date", "Nov 6"],
          ["Category", "Work"],
          ["Note", "Add the intro and charts"],
        ],
      },
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      routine: {
        range: "Nov 2 – 8",
        items: [
          ["Drink water", "This month 5/6"],
          ["Read", "This month 4/6"],
          ["Walk", "This month 5/6"],
        ],
      },
      calendar: {
        month: "November 2026",
        items: {
          3: ["Client meeting"],
          6: ["Finish the report draft", "Grocery shopping"],
          9: ["Prepare slides"],
          12: ["Bill", "Class notes"],
          17: ["Project deadline"],
          20: ["Code review", "Shopping"],
          24: ["Appointment"],
          27: ["Weekly plan", "Reading"],
        },
        pct: { 3: "100%", 6: "33%" },
        selected: "Selected day",
        hide: "Hide panel",
        dayTitle: "Friday, Nov 6",
        dayMeta: "6 tasks · 2 done",
        addPlaceholder: "Add a task for Nov 6...",
      },
      archive: {
        meta: "Recurring series",
        oneTime: "One-time",
        series: "Recurring series",
        stats: [
          ["Active series", "3"],
          ["Pending today", "2"],
          ["Overall completion", "71%"],
        ],
        items: [
          [
            "Weekly plan",
            "work",
            "Every Monday · 12 times",
            8,
            12,
            "Next: Nov 9",
          ],
          [
            "Check the bills",
            "personal",
            "Every Friday · 6 times",
            5,
            6,
            "Next: Today",
          ],
          [
            "Water the plants",
            "health",
            "Every day · 20 times",
            14,
            20,
            "Next: Today",
          ],
        ],
        progress: (done, total) => done + " / " + total + " done",
      },
    },
  };

  const t = STRINGS[document.documentElement.lang] || STRINGS.en;
  const state = { tab: "today", theme: "gray" };
  const THEME_ORDER = [
    "gray",
    "purple",
    "blue",
    "red",
    "green",
    "pink",
    "black",
  ];
  const TAB_ORDER = ["today", "routine", "calendar", "archive"];

  const ICONS = {
    dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    today: "M12 3a9 9 0 100 18 9 9 0 000-18zM8 12l3 3 5-6",
    routine:
      "M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5",
    calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    archive: "M3 4h18v4H3zM5 8v12h14V8M10 12h4",
    projects:
      "M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    settings:
      "M12 15a3 3 0 100-6 3 3 0 000 6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    plus: "M12 5v14M5 12h14",
    clock: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z",
    prev: "M15 6l-6 6 6 6",
    next: "M9 6l6 6-6 6",
  };

  const NAV = [
    { label: t.nav.dashboard, icon: ICONS.dashboard },
    { label: t.tabs.today, badge: "4", icon: ICONS.today, tab: "today" },
    { label: t.tabs.routine, badge: "2", icon: ICONS.routine, tab: "routine" },
    { label: t.tabs.calendar, icon: ICONS.calendar, tab: "calendar" },
    { label: t.tabs.archive, icon: ICONS.archive, tab: "archive" },
    { label: t.nav.projects, badge: "3", icon: ICONS.projects },
    { label: t.nav.settings, icon: ICONS.settings },
  ];

  const BOTTOM_NAV = [
    { label: t.nav.dashboard, icon: ICONS.dashboard },
    { label: t.tabs.today, icon: ICONS.today, tab: "today" },
    { label: t.nav.routineShort, icon: ICONS.routine, tab: "routine" },
    { label: t.tabs.calendar, icon: ICONS.calendar, tab: "calendar" },
    { label: t.nav.more, icon: ICONS.more, tab: "archive" },
  ];

  const CHECK =
    '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.5l2.5 2.5L11 4.5" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  const LOGO =
    '<svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><defs><mask id="lgm" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"></rect><polygon points="32,8.2 52.3,20.1 52.3,43.9 32,55.8 11.7,43.9 11.7,20.1" fill="none" stroke="#000" stroke-width="2.4" stroke-linejoin="round"></polygon><g transform="translate(12.8 13.85) scale(0.6)" fill="none" stroke="#000" stroke-linecap="round"><circle cx="32" cy="10" r="6" stroke-width="5"></circle><line x1="32" y1="16" x2="32" y2="52" stroke-width="7"></line><line x1="21" y1="24" x2="43" y2="24" stroke-width="6"></line><path d="M 7 38 Q 9 59 32 59 Q 55 59 57 38 L 46 45 Q 42 51 32 51 Q 22 51 18 45 Z" fill="#000" stroke="none"></path></g></mask></defs><polygon points="32,4 56,18 56,46 32,60 8,46 8,18" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round" mask="url(#lgm)"></polygon></svg>';

  function icon(path, size) {
    return (
      '<svg width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
      path +
      '"></path></svg>'
    );
  }

  function progress(done, total) {
    // Width is applied after render through the CSSOM (see applyWidths).
    return (
      '<div class="mock-progress"><span data-width="' +
      Math.round((done / total) * 100) +
      '"></span></div>'
    );
  }

  function head(title, meta) {
    return (
      '<div class="mock-head"><h2>' +
      title +
      '</h2><span class="mock-meta">' +
      meta +
      "</span></div>"
    );
  }

  function dot(category) {
    return (
      '<span class="mock-dot" data-cat="' +
      category +
      '" aria-hidden="true"></span>'
    );
  }

  function task(title, category, done, selected) {
    return (
      '<div class="mock-task' +
      (selected ? " is-selected" : "") +
      '">' +
      '<span class="mock-box' +
      (done ? " is-done" : "") +
      '" aria-hidden="true">' +
      (done ? CHECK : "") +
      "</span>" +
      '<span class="mock-task-title' +
      (done ? " is-done-text" : "") +
      '">' +
      title +
      "</span>" +
      '<span class="mock-cat">' +
      dot(category) +
      t.categories[category] +
      "</span></div>"
    );
  }

  function renderToday() {
    const s = t.today;
    const categories = ["work", "personal", "growth", "personal"];
    const open = s.tasks
      .map((title, i) => task(title, categories[i], false, i === 0))
      .join("");
    const done = s.doneTasks
      .map((title, i) => task(title, i === 0 ? "work" : "health", true, false))
      .join("");
    const rows = s.rows
      .map(
        ([label, value], i) =>
          '<div class="mock-row"><span>' +
          label +
          "</span><span" +
          (i === 3 ? ' class="mock-row-note"' : "") +
          ">" +
          value +
          "</span></div>",
      )
      .join("");

    return (
      head(t.tabs.today, s.meta) +
      '<div class="mock-columns"><div class="mock-list">' +
      // Mirrors the app's add bar: accent plus, placeholder, date/time/repeat tools.
      '<div class="mock-add"><span class="mock-add-plus">' +
      icon(ICONS.plus, 18) +
      "</span>" +
      '<span class="mock-add-text">' +
      s.addPlaceholder +
      "</span>" +
      '<span class="mock-add-tools">' +
      icon(ICONS.calendar, 16) +
      icon(ICONS.clock, 16) +
      icon(ICONS.routine, 16) +
      "</span></div>" +
      '<div class="mock-label">' +
      s.open +
      "</div>" +
      open +
      '<div class="mock-label">' +
      s.done +
      "</div>" +
      done +
      "</div>" +
      '<div class="mock-panel"><div class="mock-panel-label">' +
      s.detail +
      "</div>" +
      '<div class="mock-panel-title">' +
      s.tasks[0] +
      "</div>" +
      '<div class="mock-rows">' +
      rows +
      "</div></div></div>"
    );
  }

  function renderRoutine() {
    const days = [
      [1, 1, 1, 0, 1, 0, 0],
      [1, 0, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 0],
    ];
    const weekHead = t.days
      .map(
        (label, i) =>
          '<span class="mock-day' +
          (i === 4 ? " is-today" : "") +
          '">' +
          label +
          "<strong>" +
          (2 + i) +
          "</strong></span>",
      )
      .join("");
    const rows = t.routine.items
      .map(([name, month], r) => {
        const cells = days[r]
          .map((value, i) => {
            const cls = value ? " is-done" : i > 4 ? " is-future" : "";
            return (
              '<span class="mock-cell"><span class="mock-check' +
              cls +
              '" aria-hidden="true">' +
              (value ? CHECK : "") +
              "</span></span>"
            );
          })
          .join("");
        return (
          '<div class="mock-routine"><span class="mock-routine-name"><strong>' +
          name +
          "</strong><small>" +
          month +
          "</small></span>" +
          cells +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="mock-head mock-head-split"><h2>' +
      t.tabs.routine +
      "</h2>" +
      '<div class="mock-week-nav">' +
      icon(ICONS.prev, 18) +
      "<span>" +
      t.routine.range +
      "</span>" +
      icon(ICONS.next, 18) +
      "</div></div>" +
      '<div class="mock-scroll"><div class="mock-routines">' +
      '<div class="mock-week-head"><span class="mock-routine-name"></span>' +
      weekHead +
      "</div>" +
      rows +
      "</div></div>"
    );
  }

  function renderCalendar() {
    const c = t.calendar;
    const dotCats = ["work", "personal", "growth", "health"];

    function cell(number, classes, pct, items) {
      return (
        '<div class="cal-cell' +
        classes +
        '"><div class="cal-top"><span>' +
        number +
        '</span><span class="cal-pct">' +
        pct +
        "</span></div>" +
        items +
        "</div>"
      );
    }

    const cells = [];
    for (let n = 26; n <= 31; n++) {
      cells.push(cell(n, " is-faded", "", ""));
    }
    for (let day = 1; day <= 30; day++) {
      const weekend = (6 + day - 1) % 7 >= 5;
      const items = (c.items[day] || [])
        .map(
          (title, i) =>
            '<div class="cal-item">' +
            dot(dotCats[i % dotCats.length]) +
            '<span class="cal-title">' +
            title +
            "</span></div>",
        )
        .join("");
      const classes =
        (day === 6 ? " is-today" : "") + (weekend ? " is-weekend" : "");
      cells.push(cell(day, classes, c.pct[day] || "", items));
    }
    for (let n = 1; n <= 6; n++) {
      cells.push(cell(n, " is-faded", "", ""));
    }

    const weekHead = t.days
      .map((label) => "<span>" + label + "</span>")
      .join("");

    return (
      head(t.tabs.calendar, c.month) +
      '<div class="mock-columns"><div class="mock-calendar">' +
      '<div class="mock-cal-grid mock-cal-head">' +
      weekHead +
      "</div>" +
      '<div class="mock-cal-grid">' +
      cells.join("") +
      "</div></div>" +
      '<div class="mock-panel">' +
      '<div class="mock-panel-split"><span class="mock-panel-label">' +
      c.selected +
      '</span><span class="mock-panel-label">' +
      c.hide +
      "</span></div>" +
      '<div class="mock-day-title">' +
      c.dayTitle +
      "</div>" +
      '<div class="mock-day-meta">' +
      c.dayMeta +
      "</div>" +
      progress(2, 6) +
      '<div class="mock-day-tasks">' +
      '<div class="mock-day-task"><span class="mock-box" aria-hidden="true"></span><span>' +
      t.today.tasks[0] +
      "</span><span>" +
      t.categories.work +
      "</span></div>" +
      '<div class="mock-day-task"><span class="mock-box is-done" aria-hidden="true">' +
      CHECK +
      '</span><span class="is-done-text">' +
      t.today.doneTasks[0] +
      "</span><span>" +
      t.categories.work +
      "</span></div>" +
      "</div>" +
      // Mirrors the app's day panel form: input plus an icon-only add button.
      '<div class="mock-day-form"><span class="mock-day-input">' +
      c.addPlaceholder +
      '</span><span class="mock-day-add">' +
      icon(ICONS.plus, 18) +
      "</span></div>" +
      "</div></div>"
    );
  }

  function renderArchive() {
    const a = t.archive;
    const stats = a.stats
      .map(
        ([label, value]) =>
          '<div class="mock-stat"><span>' +
          label +
          "</span><strong>" +
          value +
          "</strong></div>",
      )
      .join("");
    const series = a.items
      .map(
        ([name, category, pattern, done, total, next]) =>
          '<div class="mock-series-item"><div class="mock-series-top"><span class="mock-series-name">' +
          dot(category) +
          name +
          '</span><span class="mock-series-pattern">' +
          pattern +
          "</span></div>" +
          progress(done, total) +
          '<div class="mock-series-bottom"><span>' +
          a.progress(done, total) +
          "</span><span>" +
          next +
          "</span></div></div>",
      )
      .join("");

    return (
      head(t.tabs.archive, a.meta) +
      '<div class="mock-segment"><span>' +
      a.oneTime +
      '</span><span class="is-active">' +
      a.series +
      "</span></div>" +
      '<div class="mock-stats">' +
      stats +
      "</div>" +
      '<div class="mock-series">' +
      series +
      "</div>"
    );
  }

  const PANELS = {
    today: renderToday,
    routine: renderRoutine,
    calendar: renderCalendar,
    archive: renderArchive,
  };

  function renderSidebar() {
    const items = NAV.map((item) => {
      const active = item.tab === state.tab ? " is-active" : "";
      const badge = item.badge
        ? '<span class="mock-badge">' + item.badge + "</span>"
        : "";
      return (
        '<div class="mock-nav-item' +
        active +
        '">' +
        icon(item.icon, 18) +
        "<span>" +
        item.label +
        "</span>" +
        badge +
        "</div>"
      );
    }).join("");

    return (
      '<div class="mock-side"><div class="mock-brand">' +
      LOGO +
      "<span>Anchorly</span></div>" +
      items +
      '<div class="mock-spacer"></div>' +
      '<div class="mock-auth"><span class="mock-auth-primary">' +
      t.signIn +
      '</span><span class="mock-auth-secondary">' +
      t.signUp +
      "</span></div></div>"
    );
  }

  function renderBottomNav() {
    const items = BOTTOM_NAV.map((item) => {
      const active = item.tab === state.tab ? " is-active" : "";
      return (
        '<div class="mock-bottom-item' +
        active +
        '">' +
        icon(item.icon, 20) +
        "<span>" +
        item.label +
        "</span></div>"
      );
    }).join("");
    return '<div class="mock-bottom">' + items + "</div>";
  }

  function render() {
    const tabs = TAB_ORDER.map(
      (id) =>
        '<button type="button" class="tour-tab" data-tab="' +
        id +
        '" aria-pressed="' +
        (id === state.tab) +
        '">' +
        t.tabs[id] +
        "</button>",
    ).join("");

    const swatches = THEME_ORDER.map(
      (id) =>
        '<button type="button" class="theme-swatch" data-theme-pick="' +
        id +
        '" aria-label="' +
        t.themes[id] +
        '" title="' +
        t.themes[id] +
        '" aria-pressed="' +
        (id === state.theme) +
        '"><span class="swatch-ring" data-theme="' +
        id +
        '"><span class="swatch-dot"></span></span></button>',
    ).join("");

    root.innerHTML =
      '<div class="tour-tabs" role="group" aria-label="' +
      t.tabsLabel +
      '">' +
      tabs +
      "</div>" +
      '<div class="tour-frame" data-theme="' +
      state.theme +
      '">' +
      '<div class="tour-bar"><span class="tour-light" aria-hidden="true"></span><span class="tour-light" aria-hidden="true"></span><span class="tour-light" aria-hidden="true"></span><span class="tour-url">anchorly</span></div>' +
      '<div class="tour-body">' +
      renderSidebar() +
      '<div class="mock-main">' +
      PANELS[state.tab]() +
      "</div></div>" +
      renderBottomNav() +
      "</div>" +
      '<div class="tour-themes"><span class="tour-theme-label">' +
      t.tryTheme +
      " <strong>" +
      t.themes[state.theme] +
      "</strong></span>" +
      '<div class="theme-picker" role="group" aria-label="' +
      t.themesLabel +
      '">' +
      swatches +
      "</div></div>";

    root.querySelectorAll("[data-width]").forEach((bar) => {
      bar.style.width = bar.dataset.width + "%";
    });
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest(
      "button[data-tab], button[data-theme-pick]",
    );
    if (!button) {
      return;
    }

    let selector;
    if (button.dataset.tab) {
      state.tab = button.dataset.tab;
      selector = '[data-tab="' + state.tab + '"]';
    } else {
      state.theme = button.dataset.themePick;
      selector = '[data-theme-pick="' + state.theme + '"]';
    }

    render();
    // innerHTML replaced the clicked button; give focus back to its new copy.
    root.querySelector(selector).focus();
  });

  render();
})();
