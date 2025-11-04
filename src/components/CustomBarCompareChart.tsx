import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface WarehouseStatsPoint {
  warehouse: string;
  stuckCount: number;
  avgAgeHrs: number;
  failureRatePct: number;
}

interface CustomBarCompareChartProps {
  data: WarehouseStatsPoint[];
  metric: 'stuckCount' | 'avgAgeHrs' | 'failureRatePct';
}

export default function CustomBarCompareChart({
  data,
  metric,
}: CustomBarCompareChartProps) {
  // Format axis label and tooltip label based on the active metric
  const metricLabel = useMemo(() => {
    switch (metric) {
      case 'stuckCount':
        return 'Stuck Count';
      case 'avgAgeHrs':
        return 'Avg Age (hrs)';
      case 'failureRatePct':
        return 'Load Failure %';
      default:
        return metric;
    }
  }, [metric]);

  const chartData = useMemo(() => {
    return data.map((row) => ({
      name: row.warehouse,
      value:
        metric === 'failureRatePct'
          ? Number(row.failureRatePct.toFixed(1))
          : metric === 'avgAgeHrs'
          ? Number(row.avgAgeHrs.toFixed(1))
          : row.stuckCount,
    }));
  }, [data, metric]);

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ left: 24, right: 24, top: 16, bottom: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#ccc', fontSize: 12 }}
            stroke="#888"
          />
          <YAxis
            tick={{ fill: '#ccc', fontSize: 12 }}
            stroke="#888"
            label={{
              value: metricLabel,
              angle: -90,
              position: 'insideLeft',
              fill: '#ccc',
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.75rem',
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
