import type { ClubStats } from "./dashboard-stats";

export const REVENUE_CHART_WIDTH = 600;
export const REVENUE_CHART_HEIGHT = 180;

/** Shared SVG coordinates; keep the zero baseline even when every day has revenue. */
export function revenueChartGeometry(days: ClubStats["revenueByDay"]) {
  const maximum = Math.max(1, ...days.map((day) => day.revenue));
  const points = days
    .map((day, index) => {
      const x = (index / Math.max(1, days.length - 1)) * REVENUE_CHART_WIDTH;
      const y = REVENUE_CHART_HEIGHT * (1 - day.revenue / maximum);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const area = points
    ? `0,${REVENUE_CHART_HEIGHT} ${points} ${days.length === 1 ? 0 : REVENUE_CHART_WIDTH},${REVENUE_CHART_HEIGHT}`
    : "";
  return { maximum, points, area };
}
