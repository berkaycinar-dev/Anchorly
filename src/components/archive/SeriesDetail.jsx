import { useState } from "react";
import { useNavigate } from "react-router";
import ArchivePagination from "./ArchivePagination";
import { getCategoryLabel } from "../../utils/categoryHelpers";
import {
  SERIES_PAGE_SIZE,
  filterOccurrences,
  getDaysFromToday,
  getOccurrenceStatus,
  getPageSlice,
  getTodayPageIndex,
} from "../../utils/archiveSeries";
import { formatShortDate, formatWeekdayDate } from "../../utils/archiveFormat";

const FILTERS = [
  { value: "all", labelKey: "seriesFilterAll" },
  { value: "done", labelKey: "seriesFilterDone" },
  { value: "todo", labelKey: "seriesFilterTodo" },
];

const STATUS_LABEL_KEYS = {
  done: "occurrenceDone",
  missed: "occurrenceMissed",
  today: "occurrenceToday",
  upcoming: "occurrenceUpcoming",
};

const RING_RADIUS = 36;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function SeriesDetail({ series, today, toggleTask, onSelectTask, t }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(() =>
    getTodayPageIndex(series.occurrences, today),
  );

  const visible = filterOccurrences(series.occurrences, filter);
  const slice = getPageSlice(visible, page, SERIES_PAGE_SIZE);
  const ruleText =
    series.repeat === "daily" ? t.repeatDailyHint : t.repeatWeeklyHint;

  function changeFilter(value) {
    setFilter(value);
    setPage(0);
  }

  function goToToday() {
    setFilter("all");
    setPage(getTodayPageIndex(series.occurrences, today));
  }

  return (
    <section className="archive-detail">
      <button
        type="button"
        className="btn btn-secondary archive-back-button"
        onClick={() => navigate("/archive")}
      >
        {t.backToArchive}
      </button>

      <header className="archive-detail-header">
        <h3 className="archive-detail-title">{series.title}</h3>
        <span className="task-badge task-badge-category">
          {getCategoryLabel(series.category, t)}
        </span>
      </header>

      <div className="archive-detail-layout">
        <section className="archive-dates-card">
          <div className="archive-dates-toolbar">
            <h4 className="archive-card-title">{t.seriesDatesTitle}</h4>
            <button
              type="button"
              className="btn btn-secondary archive-today-button"
              onClick={goToToday}
            >
              {t.seriesGoToToday}
            </button>
            <div
              className="segmented"
              role="group"
              aria-label={t.seriesFilterLabel}
            >
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => changeFilter(option.value)}
                >
                  {t[option.labelKey]}
                </button>
              ))}
            </div>
          </div>

          {slice.items.length === 0 ? (
            <p className="archive-dates-empty">{t.seriesNoDates}</p>
          ) : (
            <ul className="archive-dates-list">
              {slice.items.map((task) => {
                const status = getOccurrenceStatus(task, today);
                const index = series.occurrences.indexOf(task) + 1;

                return (
                  <li
                    key={task.id}
                    className="archive-date-row"
                    data-status={status}
                  >
                    <input
                      type="checkbox"
                      className="themed-checkbox"
                      aria-label={t.occurrenceToggleLabel(
                        task.title,
                        task.date,
                      )}
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="archive-date-index" aria-hidden="true">
                      {index}
                    </span>
                    <button
                      type="button"
                      className="archive-date-text"
                      aria-label={t.occurrenceOpenLabel(task.date)}
                      onClick={() => onSelectTask(task.id)}
                    >
                      {formatWeekdayDate(task.date, t.dateLocale)}
                    </button>
                    <span className="archive-date-relative">
                      {t.relativeDay(getDaysFromToday(task.date, today))}
                    </span>
                    <span className="archive-status-pill">
                      {t[STATUS_LABEL_KEYS[status]]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="archive-dates-footer">
            <span className="archive-dates-range">
              {t.paginationRange(slice.from, slice.to, slice.total)}
            </span>
            <ArchivePagination
              page={slice.page}
              pageCount={slice.pageCount}
              onPageChange={setPage}
              t={t}
            />
          </div>
        </section>

        <aside className="archive-detail-side">
          <section className="archive-side-card archive-ring-card">
            <h4 className="archive-card-title">{t.seriesCompletionTitle}</h4>
            <div className="archive-ring">
              <svg viewBox="0 0 88 88" aria-hidden="true">
                <circle
                  className="archive-ring-track"
                  cx="44"
                  cy="44"
                  r={RING_RADIUS}
                />
                <circle
                  className="archive-ring-value"
                  cx="44"
                  cy="44"
                  r={RING_RADIUS}
                  strokeDasharray={`${(series.percent / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  transform="rotate(-90 44 44)"
                />
              </svg>
              <span className="archive-ring-label">
                {t.formatPercent(series.percent)}
              </span>
            </div>
          </section>

          <section className="archive-side-card">
            <h4 className="archive-card-title">{t.seriesStatusTitle}</h4>
            <dl className="archive-facts">
              <div>
                <dt>{t.seriesMissedLabel}</dt>
                <dd>{series.missedCount}</dd>
              </div>
              <div>
                <dt>{t.seriesNextRepeatLabel}</dt>
                <dd>
                  {series.nextDate
                    ? formatShortDate(series.nextDate, t.dateLocale)
                    : t.seriesFinished}
                </dd>
              </div>
            </dl>
          </section>

          <section className="archive-side-card">
            <h4 className="archive-card-title">{t.seriesRuleTitle}</h4>
            <p className="archive-rule-text">{ruleText}</p>
            <dl className="archive-facts">
              <div>
                <dt>{t.seriesStartLabel}</dt>
                <dd>{formatShortDate(series.startDate, t.dateLocale)}</dd>
              </div>
              <div>
                <dt>{t.seriesEndLabel}</dt>
                <dd>{formatShortDate(series.endDate, t.dateLocale)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default SeriesDetail;
