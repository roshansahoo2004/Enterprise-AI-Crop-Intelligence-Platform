const Prediction = require('../models/Prediction');
const DiseaseReport = require('../models/DiseaseReport');
const YieldPrediction = require('../models/YieldPrediction');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');
const { getWeather } = require('./weatherService');

const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;
const DEFAULT_LOCATION_NAME = 'New Delhi (default — no location detected)';

/**
 * Enhanced Enterprise Context Builder for AI Copilot.
 * Aggregates all project data sources and extracts session memory facts.
 */
const buildUserContext = async (userId, locationOverride) => {
  let userProfile = null;
  let lastPrediction = null;
  let lastDisease = null;
  let lastYield = null;
  let predictionHistory = [];
  let weatherData = null;
  let locationSource = '';

  try {
    userProfile = await User.findById(userId).select('name role email location');
  } catch (err) {
    console.warn('[Context Builder] User fetch error:', err.message);
  }

  // Location Cascade
  let lat, lon;
  if (locationOverride && locationOverride.lat && locationOverride.lon) {
    lat = locationOverride.lat;
    lon = locationOverride.lon;
    locationSource = 'Browser Geolocation';
  } else if (userProfile?.location?.lat && userProfile?.location?.lon) {
    lat = userProfile.location.lat;
    lon = userProfile.location.lon;
    locationSource = `Saved Profile (${userProfile.location.name || 'User Location'})`;
  } else {
    lat = DEFAULT_LAT;
    lon = DEFAULT_LON;
    locationSource = DEFAULT_LOCATION_NAME;
  }

  try {
    const [predDoc, diseaseDoc, yieldDoc, predList, weatherRes, chatHistory] = await Promise.all([
      Prediction.findOne({ userId }).sort({ createdAt: -1 }),
      DiseaseReport.findOne({ userId }).sort({ createdAt: -1 }),
      YieldPrediction.findOne({ userId }).sort({ createdAt: -1 }),
      Prediction.find({ userId }).sort({ createdAt: -1 }).limit(5),
      getWeather(lat, lon),
      ChatMessage.find({ userId }).sort({ createdAt: -1 }).limit(15)
    ]);

    lastPrediction = predDoc;
    lastDisease = diseaseDoc;
    lastYield = yieldDoc;
    predictionHistory = predList;
    weatherData = weatherRes;

    // Session Memory Facts Extraction from Chat Messages
    var rememberedFacts = extractSessionMemory(chatHistory);

  } catch (err) {
    console.warn('[Assistant Context Builder Error]', err.message);
  }

  // Calculate Soil Health Score (0-100)
  let soilHealthScore = 78; // default benchmark
  if (lastPrediction) {
    const n = lastPrediction.nitrogen || 70;
    const p = lastPrediction.phosphorus || 45;
    const k = lastPrediction.potassium || 50;
    const ph = lastPrediction.ph || 6.5;

    const nScore = Math.min(100, (n / 80) * 100);
    const pScore = Math.min(100, (p / 50) * 100);
    const kScore = Math.min(100, (k / 60) * 100);
    const phScore = ph >= 6.0 && ph <= 7.5 ? 95 : 70;

    soilHealthScore = Math.round((nScore + pScore + kScore + phScore) / 4);
  }

  const contextLines = [];

  if (userProfile) {
    contextLines.push(`• Farmer Profile: ${userProfile.name} (${userProfile.role || 'Farmer'})`);
  }

  contextLines.push(`• Field Location Source: ${locationSource} (lat: ${lat}, lon: ${lon})`);

  if (weatherData) {
    contextLines.push(`• Live Weather Telemetry: ${weatherData.location || 'Local Region'} — Temp: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, Rain Prob: ${weatherData.rainProbability || 20}%, Wind: ${weatherData.windSpeed}m/s, Source: ${weatherData.source}`);
  }

  if (lastPrediction) {
    contextLines.push(`• Latest Recommended Crop: ${lastPrediction.predictedCrop} (Confidence: ${lastPrediction.confidence}%)`);
    contextLines.push(`• Soil Nutrients & Telemetry: Nitrogen=${lastPrediction.nitrogen || 70} mg/kg, Phosphorus=${lastPrediction.phosphorus || 45} mg/kg, Potassium=${lastPrediction.potassium || 50} mg/kg, pH=${lastPrediction.ph || 6.5}`);
    contextLines.push(`• Calculated Soil Health Index: ${soilHealthScore}/100`);
  }

  if (lastDisease) {
    contextLines.push(`• Latest Pathology Scan: ${lastDisease.disease} (Status: ${lastDisease.status || 'Verified'}, Certainty: ${lastDisease.confidence}%)`);
  }

  if (lastYield) {
    contextLines.push(`• Latest Yield & Profit Estimate: ${lastYield.cropName} (${lastYield.fieldAreaHectares} ha) — Predicted Yield: ${lastYield.totalPredictedYieldTons} Tons, Est Profit: $${lastYield.estimatedProfitUsd?.toLocaleString()}`);
  }

  if (predictionHistory && predictionHistory.length > 0) {
    const crops = predictionHistory.map(p => p.predictedCrop).join(', ');
    contextLines.push(`• Prediction History (Past 5): ${crops}`);
  }

  if (rememberedFacts && Object.keys(rememberedFacts).length > 0) {
    contextLines.push(`• Persistent Session Memory (Remembered Facts): ${JSON.stringify(rememberedFacts)}`);
  }

  return {
    contextSummary: contextLines.length > 0 ? contextLines.join('\n') : 'No recent telemetry recorded.',
    lastCrop: lastPrediction?.predictedCrop || rememberedFacts?.crop || 'Rice',
    lastDisease: lastDisease?.disease || null,
    weatherData,
    lastPrediction,
    lastDisease,
    lastYield,
    soilHealthScore,
    userProfile,
    rememberedFacts
  };
};

/**
 * Utility to extract session memory facts from chat history
 */
function extractSessionMemory(chatMessages) {
  const memory = {};
  if (!chatMessages || chatMessages.length === 0) return memory;

  const fullText = chatMessages.map(m => m.text).join(' ');

  // Regex patterns for crop, area/acres, location
  const cropMatch = fullText.match(/(?:growing|planted|crop is|cultivating|farming)\s+([a-zA-Z]+)/i);
  if (cropMatch) memory.crop = cropMatch[1];

  const areaMatch = fullText.match(/(\d+(?:\.\d+)?)\s*(?:acres?|hectares?|ha|acre)/i);
  if (areaMatch) memory.area = `${areaMatch[1]} acres`;

  const locMatch = fullText.match(/(?:located in|farm in|in|at)\s+([A-Z][a-zA-Z\s]+)/);
  if (locMatch) memory.location = locMatch[1].trim();

  return memory;
}

module.exports = { buildUserContext };
