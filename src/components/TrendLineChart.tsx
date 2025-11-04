import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface TrendPoint {
  dateLabel: string;         // e.g. "Oct 05"
  stuckCount: number;        // e.g. 5
  totalShipmentsScaled: number; // e.g. 41 (scaled/normalized)
}

interface TrendLineChartProps {
  data: TrendPoint[];
}

export default function TrendLineChart({ data }: TrendLineChartProps) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 24, right: 24, top: 16, bottom: 16 }}>
          <CartesianGrid stroke="#444" strokeDasharray="3 3" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#ccc', fontSize: 12 }}
            stroke="#888"
          />
          <YAxis
            yAxisId="left"
            label={{
              value: 'Stuck Shipments Count',
              angle: -90,
              position: 'insideLeft',
              fill: '#ccc',
              fontSize: 12,
            }}
            tick={{ fill: '#ccc', fontSize: 12 }}
            stroke="#888"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #4b5563',
              borderRadius: '0.5rem',
              color: '#fff',
              fontSize: '0.75rem',
            }}
          />
          <Legend
            wrapperStyle={{ color: '#fff', fontSize: '0.8rem' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="stuckCount"
            name="Stuck Shipments"
            stroke="#ef4444" // red-500
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="totalShipmentsScaled"
            name="Total Shipments (scaled)"
            stroke="#3b82f6" // blue-500
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
