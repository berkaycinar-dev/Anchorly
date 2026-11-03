import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import Icon from "../Icon";
import { getCategoryLabel } from "../../utils/categoryHelpers";
import { getSeriesSummary } from "../../utils/archiveSeries";
import { getArchiveSeriesPath } from "../../routes";
import { formatShortDate } from "../../utils/archiveFormat";

function SeriesList({ seriesList, t }) {
  const summary = getSeriesSummary(seriesList);

  if (seriesList.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🔁</span>
        <p className="empty-state-title">{t.seriesEmptyTitle}</p>
        <p className="empty-state-subtitle">{t.seriesEmptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="archive-series">
      <div className="archive-summary">
        <section className="archive-summary-card">
          <h3 className="archive-summary-title">{t.archiveSummarySeries}</h3>
          <p className="archive-summary-value">{summary.activeCount}</p>
        </section>
        <section className="archive-summary-card">
          <h3 className="archive-summary-title">
            {t.archiveSummaryPendingToday}
          </h3>
          <p className="archive-summary-value">{summary.pendingTodayCount}</p>
        </section>
        <section className="archive-summary-card">
          <h3 className="archive-summary-title">
            {t.archiveSummaryCompletion}
          </h3>
          <p className="archive-summary-value">
            {t.formatPercent(summary.percent)}
          </p>
        </section>
      </div>

      <ul className="archive-series-list" aria-label={t.seriesListLabel}>
        {seriesList.map((series) => (
          <li key={series.id}>
            <Link
              to={getArchiveSeriesPath(series.id)}
              className="archive-series-row"
              aria-label={t.seriesRowLabel(series.title)}
            >
              <span
                className="archive-series-dot"
                data-category={series.category}
                aria-hidden="true"
              />
              <span className="archive-series-main">
                <span className="archive-series-title">{series.title}</span>
                <span className="archive-series-meta">
                  {`${getCategoryLabel(series.category, t)} · ${t.seriesRowMeta(
                    series.repeat === "daily" ? t.repeatDaily : t.repeatWeekly,
                    series.doneCount,
                    series.elapsedCount,
                  )}`}
                </span>
                <span className="archive-series-track" aria-hidden="true">
                  <span
                    className="archive-series-bar"
                    style={{ width: `${series.percent}%` }}
                  />
                </span>
              </span>
              <span className="archive-series-next">
                <span className="archive-series-next-label">
                  {t.seriesNextLabel}
                </span>
                <span className="archive-series-next-value">
                  {series.nextDate
                    ? formatShortDate(series.nextDate, t.dateLocale)
                    : t.seriesFinished}
                </span>
              </span>
              <Icon icon={ChevronRight} size="sm" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SeriesList;
