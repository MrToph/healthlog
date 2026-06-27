import { speedToPaceMinutesPerKilometer } from "./running.js";

describe("speedToPaceMinutesPerKilometer", () => {
  it("formats meters per second as M:SS minutes per kilometer", () => {
    expect(speedToPaceMinutesPerKilometer(2.7777777778)).toBe("6:00");
    expect(speedToPaceMinutesPerKilometer(2.5641025641)).toBe("6:30");
  });

  it("returns 0:00 when speed is zero or negative", () => {
    expect(speedToPaceMinutesPerKilometer(0)).toBe("0:00");
    expect(speedToPaceMinutesPerKilometer(-1)).toBe("0:00");
  });
});
