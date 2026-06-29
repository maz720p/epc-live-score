import { describe, it, expect } from "vitest";

/**
 * Example unit test for the core "leaderboard is derived from events"
 * invariant. In a full setup this would hit a local Supabase instance;
 * here it documents and verifies the aggregation rule in isolation.
 */
function computeTotal(events: { score_value: number; is_voided: boolean }[]) {
  return events.filter((e) => !e.is_voided).reduce((sum, e) => sum + e.score_value, 0);
}

describe("leaderboard aggregation", () => {
  it("sums non-voided score events", () => {
    const events = [
      { score_value: 10, is_voided: false },
      { score_value: -5, is_voided: false },
      { score_value: 20, is_voided: false },
    ];
    expect(computeTotal(events)).toBe(25);
  });

  it("excludes voided (undone) events", () => {
    const events = [
      { score_value: 10, is_voided: false },
      { score_value: 5, is_voided: true },
    ];
    expect(computeTotal(events)).toBe(10);
  });
});
