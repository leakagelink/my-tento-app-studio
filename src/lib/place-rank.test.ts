import { describe, expect, it } from "vitest";
import { rankPlaces } from "./place-rank";

describe("rankPlaces", () => {
  it("shows the user's own-city match before same-name places far away", () => {
    const lucknow = { lat: 26.8467, lng: 80.9462 };
    const out = rankPlaces([
      { id: "far", name: "Gomti Nagar Delhi", address: "", point: { lat: 28.61, lng: 77.2 } },
      { id: "near", name: "Gomti Nagar", address: "", point: { lat: 26.85, lng: 81.0 } },
    ], lucknow);
    expect(out.map((p) => p.id)).toEqual(["near", "far"]);
  });
});
