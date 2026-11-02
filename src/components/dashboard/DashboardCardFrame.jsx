import { Link } from "react-router";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
} from "lucide-react";
import Icon from "../Icon";

function DashboardCardFrame({
  entry,
  index,
  count,
  definition,
  isEditing,
  settle,
  meta,
  t,
  onMove,
  onRemove,
  onResize,
  children,
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: entry.id, disabled: !isEditing });
  const name = t.cardNames[entry.id];
  const isWide = entry.size === "wide";
  const settleClass = settle ? ` dashboard-card-settle-${settle}` : "";

  function handleToolbarKeyDown(event) {
    if (!event.altKey) {
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      onMove(index, index + (event.key === "ArrowDown" ? 1 : -1));
    }
  }

  return (
    <section
      ref={setNodeRef}
      className={`dashboard-card${isEditing ? " dashboard-card-editing" : ""}${
        isDragging ? " dashboard-card-dragging" : ""
      }${isOver && !isDragging ? " dashboard-card-over" : ""}${settleClass}`}
      data-size={entry.size}
      data-card={entry.id}
      aria-label={name}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        animationDelay: `${index * 45}ms`,
      }}
    >
      {isEditing && (
        <div
          className="dashboard-card-toolbar"
          onKeyDown={handleToolbarKeyDown}
        >
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="dashboard-icon-button dashboard-drag-handle"
            aria-label={t.cardDragLabel(name)}
            title={t.cardDragLabel(name)}
            {...attributes}
            {...listeners}
          >
            <Icon icon={GripVertical} size="sm" />
          </button>

          <div
            className="dashboard-segmented"
            role="group"
            aria-label={t.cardSizeLabel(name)}
          >
            <button
              type="button"
              aria-pressed={!isWide}
              onClick={() => onResize(entry.id, "small")}
            >
              {t.cardSizeSmall}
            </button>
            <button
              type="button"
              aria-pressed={isWide}
              onClick={() => onResize(entry.id, "wide")}
            >
              {t.cardSizeWide}
            </button>
          </div>

          <span className="dashboard-toolbar-spacer" />

          <button
            type="button"
            className="dashboard-icon-button"
            aria-label={t.cardMoveUpLabel(name)}
            title={t.cardMoveUpLabel(name)}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <Icon icon={ChevronUp} size="sm" />
          </button>
          <button
            type="button"
            className="dashboard-icon-button"
            aria-label={t.cardMoveDownLabel(name)}
            title={t.cardMoveDownLabel(name)}
            disabled={index === count - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <Icon icon={ChevronDown} size="sm" />
          </button>
          <button
            type="button"
            className="dashboard-icon-button"
            aria-label={t.cardRemoveLabel(name)}
            title={t.cardRemoveLabel(name)}
            onClick={() => onRemove(entry.id)}
          >
            <Icon icon={X} size="sm" />
          </button>
        </div>
      )}

      <header className="dashboard-card-header">
        <h3>{name}</h3>
        {!isEditing && meta && (
          <span className="dashboard-card-meta">{meta}</span>
        )}
        {!isEditing && (
          <Link
            to={definition.path}
            className="dashboard-icon-button dashboard-card-link"
            aria-label={t.cardOpenPageLabel(t[definition.pageKey])}
            title={t.cardOpenPageLabel(t[definition.pageKey])}
          >
            <Icon icon={ArrowUpRight} size="sm" />
          </Link>
        )}
      </header>

      <div className="dashboard-card-body">{children}</div>
    </section>
  );
}

export default DashboardCardFrame;
