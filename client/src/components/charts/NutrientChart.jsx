import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const NutrientChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">No data available</div>;
  }

  // Calculate overall averages across all predictions
  const avgN = data.reduce((sum, item) => sum + item.avgNitrogen * item.count, 0) / data.reduce((sum, item) => sum + item.count, 0);
  const avgP = data.reduce((sum, item) => sum + item.avgPhosphorus * item.count, 0) / data.reduce((sum, item) => sum + item.count, 0);
  const avgK = data.reduce((sum, item) => sum + item.avgPotassium * item.count, 0) / data.reduce((sum, item) => sum + item.count, 0);

  const chartData = [
    { subject: 'Nitrogen', A: avgN, fullMark: 150 },
    { subject: 'Phosphorus', A: avgP, fullMark: 150 },
    { subject: 'Potassium', A: avgK, fullMark: 200 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border-white/10">
          <p className="font-semibold text-white">{payload[0].payload.subject}</p>
          <p className="text-sm text-primary-400 font-bold">{Math.round(payload[0].value)} kg/ha</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }} />
        <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Average Nutrients"
          dataKey="A"
          stroke="#10b981"
          strokeWidth={2}
          fill="#10b981"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default NutrientChart;
