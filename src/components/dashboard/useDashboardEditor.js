import { useState } from "react";
import { getCardDefinition } from "../../constants/dashboardCards";

function moveItem(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function useDashboardEditor({ layout, onSave, t }) {
  const [draft, setDraft] = useState(null);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [lastMoved, setLastMoved] = useState(null);

  const isEditing = draft !== null;
  const cards = isEditing ? draft : layout;

  function nameOf(id) {
    return t.cardNames[id];
  }

  function update(next, message, movedId = null) {
    setDraft(next);
    setPickedSlot(null);
    setAnnouncement(message);

    if (movedId) {
      setLastMoved((current) => ({
        id: movedId,
        count: (current?.count ?? 0) + 1,
      }));
    }
  }

  function start() {
    setDraft(layout);
    setPickedSlot(null);
    setLastMoved(null);
    setAnnouncement(t.dashboardEditHint);
  }

  function cancel() {
    setDraft(null);
    setPickedSlot(null);
    setLastMoved(null);
    setAnnouncement("");
  }

  function finish() {
    onSave(draft);
    cancel();
  }

  function move(from, to) {
    if (to < 0 || to >= draft.length || from === to) {
      return;
    }

    const id = draft[from].id;
    update(
      moveItem(draft, from, to),
      t.cardMovedAnnouncement(nameOf(id), from + 1, to + 1),
      id,
    );
  }

  function moveToSlot(from, slotIndex) {
    const target = from < slotIndex ? slotIndex - 1 : slotIndex;
    const next = moveItem(draft, from, target);
    const id = next[target].id;
    next[target] = { id, size: "small" };

    update(next, t.cardMovedToSlotAnnouncement(nameOf(id), target + 1), id);
  }

  function moveById(activeId, overId) {
    const from = draft.findIndex((entry) => entry.id === activeId);

    if (from === -1) {
      return;
    }

    if (typeof overId === "string" && overId.startsWith("slot-")) {
      moveToSlot(from, Number(overId.slice(5)));
      return;
    }

    move(
      from,
      draft.findIndex((entry) => entry.id === overId),
    );
  }

  function add(id) {
    if (pickedSlot !== null) {
      const next = [...draft];
      next.splice(pickedSlot, 0, { id, size: "small" });
      update(next, t.cardAddedToSlotAnnouncement(nameOf(id)), id);
      return;
    }

    update(
      [...draft, { id, size: getCardDefinition(id).size }],
      t.cardAddedAnnouncement(nameOf(id)),
      id,
    );
  }

  function remove(id) {
    update(
      draft.filter((entry) => entry.id !== id),
      t.cardRemovedAnnouncement(nameOf(id)),
    );
  }

  function resize(id, size) {
    update(
      draft.map((entry) => (entry.id === id ? { id, size } : entry)),
      t.cardResizedAnnouncement(
        nameOf(id),
        size === "wide" ? t.cardSizeWide : t.cardSizeSmall,
      ),
    );
  }

  function toggleSlot(slotIndex) {
    const releasing = pickedSlot === slotIndex;
    setPickedSlot(releasing ? null : slotIndex);
    setAnnouncement(
      releasing ? t.slotReleasedAnnouncement : t.slotPickedAnnouncement,
    );
  }

  return {
    cards,
    isEditing,
    pickedSlot,
    announcement,
    lastMoved,
    start,
    cancel,
    finish,
    move,
    moveById,
    add,
    remove,
    resize,
    toggleSlot,
  };
}
