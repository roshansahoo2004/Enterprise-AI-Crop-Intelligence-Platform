import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { FiBarChart2 } from 'react-icons/fi';

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  Phase-8 Step-1: FeatureImportanceChart
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Horizontal bar chart displaying feature importance (topFactors) from the
 *  XAI explanation. Uses Recharts (already installed in the project).
 *
 *  Props:
 *    topFactors: [{
 *      feature: string,    // "Nitrogen", "Rainfall", etc.
 *      impact: number,     // 0.0–1.0 normalized weight
 *      direction: string   // "positive" | "neutral" | "negative"
 *    }]
 */

// ─── Direction → Color Mapping ──────────────────────────────────────────────
const DIRECTION_COLORS = {
  positive: '#34d399', // primary-400 / emerald
  neutral:  '#fbbf24', // secondary-400 / amber
  negative: '#f87171', // red-400
};

const DIRECTION_LABELS = {
  positive: 'Supports prediction',
  neutral:  'Marginal impact',
  negative: 'Against prediction',
};

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const color = DIRECTION_COLORS[data.direction] || DIRECTION_COLORS.neutral;

  return (
    <div className="bg-surface-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-white mb-1">{data.feature}</p>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        ></span>
        <span className="text-xs text-gray-400">
          Impact: <span className="text-white font-bold">{(data.impact * 100).toFixed(0)}%</span>
        </span>
      </div>
      <p className="text-xs mt-1" style={{ color }}>
        {DIRECTION_LABELS[data.direction] || data.direction}
      </p>
    </div>
  );
};

const FeatureImportanceChart = ({ topFactors }) => {
  if (!topFactors || topFactors.length === 0) return null;

  // Sort by impact descending for visual hierarchy
  const chartData = [...topFactors]
    .sort((a, b) => b.impact - a.impact)
    .map((factor) => ({
      ...factor,
      // Convert to percentage for display
      impactPercent: Math.round(factor.impact * 100)
    }));

  return (
    <div className="glass-card-hover overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary-500/10 flex items-center justify-center">
            <FiBarChart2 className="text-secondary-400 w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white">
              Feature Importance
            </h3>
            <p className="text-xs text-gray-500">Contribution to prediction</p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          {Object.entries(DIRECTION_COLORS).map(([dir, color]) => (
            <div key={dir} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              ></span>
              <span className="text-gray-500 capitalize">{dir}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="w-full" style={{ height: Math.max(200, chartData.length * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 'dataMax']}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis
                dataKey="feature"
                type="category"
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar
                dataKey="impactPercent"
                radius={[0, 6, 6, 0]}
                barSize={22}
                animationDuration={800}
                animationEasing="ease-out"
              >
                <LabelList
                  dataKey="impactPercent"
                  position="right"
                  formatter={(val) => `${val}%`}
                  fill="#94a3b8"
                  fontSize={11}
                  fontWeight={600}
                  offset={8}
                />
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DIRECTION_COLORS[entry.direction] || DIRECTION_COLORS.neutral}
                    fillOpacity={0.8}
                    className="transition-all duration-300 hover:fill-opacity-100 hover:brightness-110 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FeatureImportanceChart;
