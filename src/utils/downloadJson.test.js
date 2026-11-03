import { afterEach, describe, expect, it, vi } from "vitest";
import downloadJson from "./downloadJson";

afterEach(() => {
  vi.restoreAllMocks();
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

describe("downloadJson", () => {
  it("downloads pretty printed JSON under the given name", async () => {
    let blob = null;
    URL.createObjectURL = vi.fn((value) => {
      blob = value;
      return "blob:test";
    });
    URL.revokeObjectURL = vi.fn();
    const clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function click() {
        clicked.push([this.download, this.href, this.isConnected]);
      },
    );

    downloadJson({ tasks: [1] }, "export.json");

    expect(clicked).toEqual([["export.json", "blob:test", true]]);
    expect(blob.type).toBe("application/json");
    expect(await blob.text()).toBe('{\n  "tasks": [\n    1\n  ]\n}');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
