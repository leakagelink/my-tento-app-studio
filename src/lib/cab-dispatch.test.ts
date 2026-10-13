import { describe, expect, it } from "vitest";
import { nearestFirst, searchRadius } from "./cab-dispatch";

describe("cab matching", () => {
  it("shows the nearest driver first even if the incoming records are unsorted", () => {
    expect(nearestFirst([{ id: "far", distance_km: 8 }, { id: "nearest", distance_km: 0.4 }, { id: "middle", distance_km: 2 }]).map(d => d.id)).toEqual(["nearest", "middle", "far"]);
  });
  it("expands the search range progressively", () => {
    expect([0, 9, 10, 19, 20, 29, 30, 120].map(searchRadius)).toEqual([2, 2, 5, 5, 10, 10, 15, 15]);
  });
});