import { describe, expect, it } from "vitest";

import {
  buildTimestampedName,
  expandViewportToFitClip,
} from "../src/social-video.js";

describe("expandViewportToFitClip", () => {
  it("keeps the viewport unchanged when the clip already fits", () => {
    expect(
      expandViewportToFitClip(
        { width: 1600, height: 1100 },
        { x: 80, y: 40, width: 1440, height: 900 },
      ),
    ).toEqual({ width: 1600, height: 1100 });
  });

  it("expands the viewport height to fit the full clip", () => {
    expect(
      expandViewportToFitClip(
        { width: 1600, height: 1100 },
        { x: 0, y: 24, width: 1440, height: 1209 },
      ),
    ).toEqual({ width: 1600, height: 1233 });
  });

  it("expands the viewport width to fit an offset clip", () => {
    expect(
      expandViewportToFitClip(
        { width: 1200, height: 1100 },
        { x: 24, y: 24, width: 1440, height: 900 },
      ),
    ).toEqual({ width: 1464, height: 1100 });
  });
});

describe("buildTimestampedName", () => {
  it("adds a sortable timestamp suffix to the base name", () => {
    expect(buildTimestampedName("race", new Date("2026-04-07T00:52:03Z"))).toBe(
      "race-20260407-005203",
    );
  });

  it("preserves a custom base name", () => {
    expect(
      buildTimestampedName("debug-race", new Date("2026-12-31T23:59:59Z")),
    ).toBe("debug-race-20261231-235959");
  });
});
