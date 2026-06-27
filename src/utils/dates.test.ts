import { parseDateRange } from "./dates.js";

describe("parseDateRange", () => {
  it("expands UTC bounds by 24 hours on both sides", () => {
    const range = parseDateRange({ from: "2026-01-02", to: "2026-01-03" });

    expect(range).toEqual({
      from: "2026-01-02",
      to: "2026-01-03",
      startedAtFromMs: Date.UTC(2026, 0, 1),
      startedAtBeforeMs: Date.UTC(2026, 0, 5),
    });
  });

  it("rejects invalid calendar dates", () => {
    expect(() => parseDateRange({ from: "2026-02-31" })).toThrow(
      "real calendar date",
    );
  });
});
