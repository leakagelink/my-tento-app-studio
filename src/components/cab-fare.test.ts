import { describe, expect, it } from "vitest";
import { rideFare, pickupEtaMin } from "./client-requirement-panels";

describe("cab fare", () => {
  it("is base fare plus per-km rate times distance", () => {
    expect(rideFare({ base_fare: 50, per_km_rate: 12 }, 10)).toBe(170);
  });
  it("pickup ETA is ~25 km/h plus 2 min", () => {
    expect(pickupEtaMin(5)).toBe(14);
  });
});
