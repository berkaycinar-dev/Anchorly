import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import Icon from "../Icon";

function DashboardSlot({ slotIndex, isPicked, t, onToggle }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIndex}` });

  return (
    <div
      ref={setNodeRef}
      className={`dashboard-slot${isPicked || isOver ? " dashboard-slot-active" : ""}`}
      data-slot={slotIndex}
    >
      <span className="dashboard-slot-icon" aria-hidden="true">
        <Icon icon={Plus} size="md" />
      </span>
      <p className="dashboard-slot-title">{t.emptySlotTitle}</p>
      <p className="dashboard-slot-hint">
        {isPicked ? t.emptySlotPickedHint : t.emptySlotHint}
      </p>
      <button
        type="button"
        className={isPicked ? "btn btn-secondary" : "btn btn-primary"}
        aria-pressed={isPicked}
        onClick={() => onToggle(slotIndex)}
      >
        {isPicked ? t.emptySlotRelease : t.emptySlotPick}
      </button>
    </div>
  );
}

export default DashboardSlot;
