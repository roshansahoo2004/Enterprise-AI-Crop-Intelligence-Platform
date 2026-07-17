// ─── Crop emoji and color mapping ─────────────────────────────────────────
export const cropConfig = {
  rice:         { emoji: '🌾', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  maize:        { emoji: '🌽', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  chickpea:     { emoji: '🫘', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  kidneybeans:  { emoji: '🫘', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  pigeonpeas:   { emoji: '🌱', color: '#65a30d', bg: 'rgba(101,163,13,0.1)' },
  mothbeans:    { emoji: '🌱', color: '#84cc16', bg: 'rgba(132,204,22,0.1)' },
  mungbean:     { emoji: '🌱', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  blackgram:    { emoji: '🌑', color: '#374151', bg: 'rgba(55,65,81,0.1)' },
  lentil:       { emoji: '🟤', color: '#b45309', bg: 'rgba(180,83,9,0.1)' },
  pomegranate:  { emoji: '🍎', color: '#e11d48', bg: 'rgba(225,29,72,0.1)' },
  banana:       { emoji: '🍌', color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  mango:        { emoji: '🥭', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  grapes:       { emoji: '🍇', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  watermelon:   { emoji: '🍉', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  muskmelon:    { emoji: '🍈', color: '#a3e635', bg: 'rgba(163,230,53,0.1)' },
  apple:        { emoji: '🍎', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  orange:       { emoji: '🍊', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  papaya:       { emoji: '🍈', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  coconut:      { emoji: '🥥', color: '#92400e', bg: 'rgba(146,64,14,0.1)' },
  cotton:       { emoji: '☁️', color: '#f1f5f9', bg: 'rgba(241,245,249,0.1)' },
  jute:         { emoji: '🧵', color: '#a16207', bg: 'rgba(161,98,7,0.1)' },
  coffee:       { emoji: '☕', color: '#78350f', bg: 'rgba(120,53,15,0.1)' },
};

// ─── Get crop display data ────────────────────────────────────────────────
export const getCropData = (cropName) => {
  const name = cropName?.toLowerCase() || '';
  return cropConfig[name] || { emoji: '🌿', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
};

// ─── Confidence level badge ───────────────────────────────────────────────
export const getConfidenceLevel = (confidence) => {
  if (confidence >= 90) return { label: 'Excellent', color: 'text-primary-400', bg: 'bg-primary-400/10' };
  if (confidence >= 75) return { label: 'High', color: 'text-green-400', bg: 'bg-green-400/10' };
  if (confidence >= 60) return { label: 'Good', color: 'text-secondary-400', bg: 'bg-secondary-400/10' };
  if (confidence >= 40) return { label: 'Moderate', color: 'text-orange-400', bg: 'bg-orange-400/10' };
  return { label: 'Low', color: 'text-red-400', bg: 'bg-red-400/10' };
};

// ─── Input field definitions ──────────────────────────────────────────────
export const inputFields = [
  { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', min: 0, max: 200, step: 1, icon: 'N', color: '#3b82f6' },
  { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', min: 0, max: 200, step: 1, icon: 'P', color: '#f59e0b' },
  { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', min: 0, max: 300, step: 1, icon: 'K', color: '#8b5cf6' },
  { name: 'temperature', label: 'Temperature', unit: '°C', min: -10, max: 60, step: 0.1, icon: '🌡️', color: '#ef4444' },
  { name: 'humidity', label: 'Humidity', unit: '%', min: 0, max: 100, step: 0.1, icon: '💧', color: '#06b6d4' },
  { name: 'ph', label: 'Soil pH', unit: '', min: 0, max: 14, step: 0.1, icon: '⚗️', color: '#10b981' },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', min: 0, max: 500, step: 0.1, icon: '🌧️', color: '#6366f1' },
];

// ─── Chart colors ─────────────────────────────────────────────────────────
export const chartColors = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#14b8a6',
  '#6366f1', '#e11d48', '#a855f7', '#22c55e', '#eab308',
  '#2563eb', '#d946ef', '#f43f5e', '#0ea5e9', '#65a30d',
  '#7c3aed', '#dc2626'
];
