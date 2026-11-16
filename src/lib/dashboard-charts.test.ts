import { describe, expect, it } from "vitest";
import {
  revenueChartGeometry,
  REVENUE_CHART_HEIGHT,
  REVENUE_CHART_WIDTH,
} from "./dashboard-charts";

const day = (revenue: number) => ({ revenue, bookings: 1, date: "2026-11-14", label: "14. nov" });

describe("revenue chart geometry", () => {
  it("retains a zero baseline and puts the highest revenue at the top", () => {
    const result = revenueChartGeometry([day(0), day(1000), day(2000)]);
    expect(result.maximum).toBe(2000);
    expect(result.points).toBe(
      `0.00,${REVENUE_CHART_HEIGHT}.00 300.00,90.00 ${REVENUE_CHART_WIDTH}.00,0.00`,
    );
    expect(result.area).toMatch(/^0,180 .* 600,180$/);
  });
  it("keeps all 30 dates including days without revenue", () => {
    const result = revenueChartGeometry(
      Array.from({ length: 30 }, (_, index) => day(index % 2 ? 0 : 2000)),
    );
    expect(result.points.split(" ")).toHaveLength(30);
    expect(result.points).toContain("20.69,180.00");
  });
  it("avoids invalid coordinates for missing, zero or single-day data", () => {
    for (const days of [[], [day(0)], [day(1500)], [day(0), day(0)]]) {
      const result = revenueChartGeometry(days);
      expect(result.points).not.toMatch(/NaN|Infinity/);
      expect(result.maximum).toBeGreaterThan(0);
    }
  });
});
