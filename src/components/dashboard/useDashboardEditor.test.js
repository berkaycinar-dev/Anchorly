import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { strings } from "../../strings";
import useDashboardEditor from "./useDashboardEditor";

const t = strings.en;
const small = (id) => ({ id, size: "small" });
const wide = (id) => ({ id, size: "wide" });
const LAYOUT = [small("todayRing"), wide("upcoming"), small("streaks")];

function renderEditor(layout = LAYOUT) {
  const onSave = vi.fn();
  const view = renderHook(() => useDashboardEditor({ layout, onSave, t }));

  return { ...view, onSave };
}

function ids(result) {
  return result.current.cards.map((entry) => entry.id);
}

describe("useDashboardEditor", () => {
  it("shows the saved layout until editing starts", () => {
    const { result } = renderEditor();

    expect(result.current.isEditing).toBe(false);
    expect(result.current.cards).toBe(LAYOUT);
    expect(result.current.announcement).toBe("");
  });

  it("starts editing with the hint", () => {
    const { result } = renderEditor();

    act(() => result.current.start());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.announcement).toBe(t.dashboardEditHint);
  });

  it("throws away the changes on cancel", () => {
    const { result, onSave } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.remove("streaks"));
    act(() => result.current.cancel());

    expect(result.current.isEditing).toBe(false);
    expect(ids(result)).toEqual(["todayRing", "upcoming", "streaks"]);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves the changes on finish", () => {
    const { result, onSave } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.remove("streaks"));
    act(() => result.current.finish());

    expect(onSave).toHaveBeenCalledWith([small("todayRing"), wide("upcoming")]);
    expect(result.current.isEditing).toBe(false);
  });

  it("moves a card and announces it", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.move(2, 0));

    expect(ids(result)).toEqual(["streaks", "todayRing", "upcoming"]);
    expect(result.current.announcement).toBe(
      t.cardMovedAnnouncement("Streaks", 3, 1),
    );
    expect(result.current.lastMoved).toEqual({ id: "streaks", count: 1 });
  });

  it("ignores moves outside the list or onto the same place", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.move(0, -1));
    act(() => result.current.move(2, 3));
    act(() => result.current.move(1, 1));

    expect(ids(result)).toEqual(["todayRing", "upcoming", "streaks"]);
    expect(result.current.lastMoved).toBeNull();
  });

  it("counts every move so the highlight restarts", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.move(0, 1));
    act(() => result.current.move(1, 0));

    expect(result.current.lastMoved).toEqual({ id: "todayRing", count: 2 });
  });

  it("moves by id onto another card", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.moveById("todayRing", "streaks"));

    expect(ids(result)).toEqual(["upcoming", "streaks", "todayRing"]);
  });

  it("moves a card into an empty slot and makes it small", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.moveById("upcoming", "slot-3"));

    expect(result.current.cards).toEqual([
      small("todayRing"),
      small("streaks"),
      small("upcoming"),
    ]);
    expect(result.current.announcement).toBe(
      t.cardMovedToSlotAnnouncement("Upcoming", 3),
    );
  });

  it("moves a later card back into an earlier slot", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.moveById("streaks", "slot-1"));

    expect(ids(result)).toEqual(["todayRing", "streaks", "upcoming"]);
  });

  it("ignores unknown cards", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.moveById("weather", "streaks"));

    expect(ids(result)).toEqual(["todayRing", "upcoming", "streaks"]);
  });

  it("adds a card at the end with its default size", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.add("calendar"));

    expect(result.current.cards.at(-1)).toEqual(small("calendar"));
    expect(result.current.announcement).toBe(
      t.cardAddedAnnouncement("Mini calendar"),
    );
  });

  it("adds a card into the picked slot as small and releases the slot", () => {
    const { result } = renderEditor([small("todayRing"), wide("upcoming")]);

    act(() => result.current.start());
    act(() => result.current.toggleSlot(1));

    expect(result.current.pickedSlot).toBe(1);
    expect(result.current.announcement).toBe(t.slotPickedAnnouncement);

    act(() => result.current.add("todayTasks"));

    expect(result.current.cards).toEqual([
      small("todayRing"),
      small("todayTasks"),
      wide("upcoming"),
    ]);
    expect(result.current.pickedSlot).toBeNull();
    expect(result.current.announcement).toBe(
      t.cardAddedToSlotAnnouncement("Today's tasks"),
    );
  });

  it("releases a picked slot when it is toggled again", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.toggleSlot(3));
    act(() => result.current.toggleSlot(3));

    expect(result.current.pickedSlot).toBeNull();
    expect(result.current.announcement).toBe(t.slotReleasedAnnouncement);
  });

  it("releases a picked slot when the layout changes", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.toggleSlot(3));
    act(() => result.current.remove("todayRing"));

    expect(result.current.pickedSlot).toBeNull();
  });

  it("removes and resizes cards with announcements", () => {
    const { result } = renderEditor();

    act(() => result.current.start());
    act(() => result.current.resize("todayRing", "wide"));

    expect(result.current.cards[0]).toEqual(wide("todayRing"));
    expect(result.current.announcement).toBe(
      t.cardResizedAnnouncement("Today's progress", "Wide"),
    );

    act(() => result.current.resize("todayRing", "small"));

    expect(result.current.announcement).toBe(
      t.cardResizedAnnouncement("Today's progress", "Small"),
    );

    act(() => result.current.remove("upcoming"));

    expect(ids(result)).toEqual(["todayRing", "streaks"]);
    expect(result.current.announcement).toBe(
      t.cardRemovedAnnouncement("Upcoming"),
    );
  });
});
