import { useId } from "react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardMonthlyChartItem, DashboardStepPassChartItem } from "../../types/admin/dashboard";

// Atlassian light chart tokens, categorical.1–5 (brand uses categorical.1).
// https://atlassian.design/components/tokens/all-tokens
const CHART_COLORS = ["#357DE8", "#82B536", "#BF63F3", "#F68909", "#1558BC"];
const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff", border: "1px solid #EEF0F4",
  borderRadius: 8, fontSize: 12, color: "#292C35", padding: "8px 12px",
};

export function DashboardMonthlyChart({ data }: { data: DashboardMonthlyChartItem[] }) {
  const chartId = useId().replace(/:/g, "");
  return (
    <div className="dashboard-monthly-chart" role="img" aria-label={`월별 지원자 현황: ${data.map(item => `${item.month} ${item.count}명`).join(", ")}`}>
      <ResponsiveContainer width="100%" height={252}>
        <AreaChart data={data} margin={{ top: 18, right: 8, bottom: 4, left: -20 }}>
          <defs>
            <linearGradient id={`${chartId}-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.23} />
              <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0.015} />
            </linearGradient>
            <pattern id={`${chartId}-area`} width="100" height="252" patternUnits="userSpaceOnUse">
              <rect width="100" height="252" fill={`url(#${chartId}-fade)`} />
              <path d="M-100 0 L45 252 H90 L-55 0 Z M0 0 L145 252 H190 L45 0 Z" fill="#ffffff" fillOpacity={0.28} />
            </pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="#EEF0F4" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={12} tick={{ fontSize: 11, fill: "#747B8D" }} />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} allowDecimals={false} tick={{ fontSize: 11, fill: "#747B8D" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#747B8D", marginBottom: 4 }}
            formatter={(value: number) => [`${value.toLocaleString()}명`, "지원자"]}
            cursor={{ stroke: CHART_COLORS[0], strokeDasharray: "2 3", strokeWidth: 1 }} />
          <Area type="stepAfter" dataKey="count" name="지원자" stroke={CHART_COLORS[0]} strokeWidth={2}
            fill={`url(#${chartId}-area)`} dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS[0], stroke: "#ffffff", strokeWidth: 2 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardStageChart({ data, percentages }: {
  data: DashboardStepPassChartItem[];
  percentages: Map<string, number>;
}) {
  return (
    <div className="dashboard-stage-chart">
      <div role="img" aria-label={`전형 단계별 합격자 현황: ${data.map(item => `${item.name} ${item.value}명, ${percentages.get(item.id) ?? 0}%`).join(", ")}`}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={81}
              startAngle={130} endAngle={-230} paddingAngle={6} cornerRadius={4}
              stroke="none" dataKey="value" nameKey="name" isAnimationActive={false}>
              {data.map((item, index) => <Cell key={item.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number, name: string) => [`${value.toLocaleString()}명`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="dashboard-chart-legend" aria-label="전형별 비율">
        {data.map((item, index) => (
          <li key={item.id}>
            <span className="dashboard-chart-legend-dot" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span className="dashboard-chart-legend-label">{item.name}</span>
            <span className="dashboard-chart-legend-value">{percentages.get(item.id) ?? 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
