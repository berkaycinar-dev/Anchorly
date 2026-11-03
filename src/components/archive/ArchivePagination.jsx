import { ChevronLeft, ChevronRight } from "lucide-react";
import Icon from "../Icon";
import { getPaginationItems } from "../../utils/archiveSeries";

function ArchivePagination({ page, pageCount, onPageChange, t }) {
  const items = getPaginationItems(page, pageCount);

  return (
    <nav className="archive-pagination" aria-label={t.paginationLabel}>
      <button
        type="button"
        className="archive-page-button"
        aria-label={t.paginationPrevious}
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <Icon icon={ChevronLeft} size="sm" />
      </button>

      <span className="archive-page-status">
        {t.paginationStatus(page + 1, pageCount)}
      </span>

      <ul className="archive-page-numbers">
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                className="archive-page-button"
                aria-label={t.paginationPage(item + 1)}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item + 1}
              </button>
            </li>
          ) : (
            <li key={item} className="archive-page-ellipsis" aria-hidden="true">
              …
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className="archive-page-button"
        aria-label={t.paginationNext}
        disabled={page === pageCount - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <Icon icon={ChevronRight} size="sm" />
      </button>
    </nav>
  );
}

export default ArchivePagination;
