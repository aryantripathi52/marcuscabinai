'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  Tooltip,
} from 'recharts';

interface SparklineProps {
  data: number[];
  status: 'OPTIMAL' | 'NORMAL' | 'ELEVATED' | 'LOW' | 'CRITICAL';
  unit?: string;
  width?: string | number;
  height?: number;
}

export default function Sparkline({
  data,
  status,
  unit = '',
  height = 42,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className="h-10 flex items-center text-xs text-slate-500">No trend history</div>;
  }

  const chartData = data.map((val, idx) => ({
    visit: `Visit ${idx + 1}`,
    value: val,
  }));

  // Select line stroke color based on status
  let strokeColor = '#10b981'; // Optimal (emerald)
  if (status === 'CRITICAL') {
    strokeColor = '#ef4444'; // Critical (red)
  } else if (status === 'ELEVATED' || status === 'LOW') {
    strokeColor = '#f59e0b'; // Elevated / Low (amber)
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const padding = (maxValue - minValue) * 0.15 || 2;

  return (
    <div className="w-full relative" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            hide
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900/95 border border-slate-700 px-2 py-1 rounded shadow-lg text-[10px] text-slate-200">
                    <span className="font-semibold text-cyan-400">{payload[0].value}</span> {unit}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2.2}
            dot={{ r: 2.5, fill: strokeColor, stroke: '#0f172a', strokeWidth: 1.5 }}
            activeDot={{ r: 4.5, fill: '#38bdf8' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
