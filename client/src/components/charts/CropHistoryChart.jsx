import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCropData } from '../../utils/cropData';

const CropHistoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">No data available</div>;
  }

  // Take top 7 crops to avoid cluttering
  const chartData = [...data].sort((a, b) => b.count - a.count).slice(0, 7);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const cropInfo = getCropData(data._id);
      return (
        <div className="glass-card p-3 border-white/10 shadow-xl">
          <p className="font-semibold text-white capitalize mb-1 flex items-center gap-2">
            {cropInfo.emoji} {data._id}
          </p>
          <p className="text-sm text-gray-300">Predictions: <span className="font-bold text-white">{data.count}</span></p>
          <p className="text-xs text-gray-400 mt-1">Avg Confidence: {Math.round(data.avgConfidence)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
          dataKey="_id" 
          tick={{ fill: '#94a3b8', fontSize: 12, textTransform: 'capitalize' }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis 
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => {
            const cropInfo = getCropData(entry._id);
            return <Cell key={`cell-${index}`} fill={cropInfo.color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CropHistoryChart;
