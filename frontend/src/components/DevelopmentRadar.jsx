import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function DevelopmentRadar({ scores }) {
  const data = Object.entries(scores || {}).map(([dimension, value]) => ({ dimension, value }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#475569' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar dataKey="value" stroke="#2743e8" fill="#3d64f4" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
