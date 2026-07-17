import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ConfidenceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">No data available</div>;
  }

  // Extract raw history items and reverse to chronological order
  const chartData = [...data].reverse().map(item => ({
    date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    confidence: item.confidence,
    crop: item.predictedCrop
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border-white/10 shadow-xl">
          <p className="font-medium text-gray-300 mb-1">{label}</p>
          <p className="text-sm text-primary-400 font-bold mb-1">{data.confidence}% Confidence</p>
          <p className="text-xs text-gray-400 capitalize">Crop: {data.crop}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis 
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="confidence" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#fff', stroke: '#10b981', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ConfidenceChart;
