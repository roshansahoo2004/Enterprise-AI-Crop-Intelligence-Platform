import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeatherTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">No data available</div>;
  }

  // Extract raw history items and reverse to chronological order
  const chartData = [...data].reverse().map(item => ({
    date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    temperature: item.temperature,
    humidity: item.humidity,
    rainfall: item.rainfall
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border-white/10 shadow-xl">
          <p className="font-medium text-gray-300 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center justify-between gap-4 mb-1" style={{ color: entry.color }}>
              <span className="capitalize">{entry.name}:</span>
              <span className="font-bold text-white">{entry.value}{entry.name === 'temperature' ? '°C' : entry.name === 'humidity' ? '%' : 'mm'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis 
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
        <Area type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorHum)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default WeatherTrendChart;
