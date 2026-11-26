import { useEffect, useRef, useState } from "react";
import { EllipsisVertical, Flame } from "lucide-react";

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
        <EllipsisVertical size={18} strokeWidth={2.4} aria-hidden="true" />
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
          <Flame size={13} strokeWidth={2} aria-hidden="true" />
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
