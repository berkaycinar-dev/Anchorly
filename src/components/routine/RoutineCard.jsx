import { useEffect, useRef, useState } from "react";

const FLAME_PATH =
  "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z";

function RoutineMenu({ title, onDelete, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const firstItemRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    firstItemRef.current?.focus();

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="routine-menu" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        className="routine-menu-button"
        aria-label={t.routineOptionsLabel(title)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5h.01 M12 12h.01 M12 19h.01" />
        </svg>
      </button>

      {isOpen && (
        <div className="routine-menu-list" role="menu">
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            className="routine-menu-item routine-menu-item-danger"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
          >
            {t.deleteRoutineMenuItem}
          </button>
        </div>
      )}
    </div>
  );
}

export default function RoutineCard({
  routine,
  checked,
  onToggle,
  onDelete,
  streak,
  history,
  monthProgress,
  t,
}) {
  const historyCompleted = history.filter((day) => day.checked).length;

  return (
    <article className="routine-card">
      <div className="routine-card-top">
        <label className="routine-card-main">
          <input
            type="checkbox"
            className="routine-card-check"
            aria-label={routine.title}
            checked={checked}
            onChange={onToggle}
          />
          <span className="routine-card-text">
            <span className="routine-card-title">{routine.title}</span>
            <span className="routine-card-meta">
              {t.routineMonthProgress(
                monthProgress.completed,
                monthProgress.total,
              )}
            </span>
          </span>
        </label>

        <span
          className={
            streak > 0
              ? "routine-streak"
              : "routine-streak routine-streak-empty"
          }
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={FLAME_PATH} />
          </svg>
          {streak > 0 ? t.streakDays(streak) : t.noStreak}
        </span>

        <RoutineMenu title={routine.title} onDelete={onDelete} t={t} />
      </div>

      <div className="routine-card-history">
        <span className="routine-card-count" aria-hidden="true">
          {`${historyCompleted}/${history.length}`}
        </span>
        <div
          className="routine-history"
          role="img"
          aria-label={t.routineHistoryLabel(
            routine.title,
            historyCompleted,
            history.length,
          )}
        >
          {history.map((day) => {
            const classNames = ["routine-history-cell"];

            if (day.checked) {
              classNames.push("routine-history-cell-done");
            }

            if (day.isSelected) {
              classNames.push("routine-history-cell-selected");
            }

            return <span key={day.date} className={classNames.join(" ")} />;
          })}
        </div>
      </div>
    </article>
  );
}
