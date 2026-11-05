import { describe, expect, it } from "vitest";
import { readOutbox, writeOutbox } from "./outboxStorage";

const ENTRY = {
  method: "PATCH",
  path: "/tasks/1",
  body: { title: "x" },
  time: "2026-11-05T10:00:00.000Z",
};

describe("outbox storage", () => {
  it("returns nothing when nothing was saved", () => {
    expect(readOutbox("u1")).toEqual([]);
  });

  it("gives back what was saved", () => {
    writeOutbox("u1", [ENTRY]);

    expect(readOutbox("u1")).toEqual([ENTRY]);
  });

  it("keeps every user's entries apart", () => {
    writeOutbox("u1", [ENTRY]);

    expect(readOutbox("u2")).toEqual([]);
  });

  it("removes the key when the list is empty", () => {
    writeOutbox("u1", [ENTRY]);
    writeOutbox("u1", []);

    expect(localStorage.getItem("outbox:u1")).toBeNull();
  });

  it("ignores text that is not valid JSON", () => {
    localStorage.setItem("outbox:u1", "{broken");

    expect(readOutbox("u1")).toEqual([]);
  });

  it("ignores a value that is not a list", () => {
    localStorage.setItem("outbox:u1", JSON.stringify({ method: "POST" }));

    expect(readOutbox("u1")).toEqual([]);
  });

  it("drops entries that are missing a method, path or time", () => {
    localStorage.setItem(
      "outbox:u1",
      JSON.stringify([
        ENTRY,
        { method: "POST" },
        null,
        "x",
        { ...ENTRY, time: 5 },
      ]),
    );

    expect(readOutbox("u1")).toEqual([ENTRY]);
  });
});
