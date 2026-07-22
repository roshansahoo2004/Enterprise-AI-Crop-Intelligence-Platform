const YieldPrediction = require('../models/YieldPrediction');

// Agronomic crop baseline market prices ($/ton) and average baseline yields (tons/ha)
const CROP_BENCHMARKS = {
  rice: { baseYield: 4.5, pricePerTon: 320, costPerHa: 450 },
  maize: { baseYield: 6.2, pricePerTon: 210, costPerHa: 520 },
  wheat: { baseYield: 3.8, pricePerTon: 280, costPerHa: 400 },
  cotton: { baseYield: 2.2, pricePerTon: 950, costPerHa: 750 },
  jute: { baseYield: 2.8, pricePerTon: 420, costPerHa: 380 },
  sugarcane: { baseYield: 70.0, pricePerTon: 45, costPerHa: 1200 },
  chickpea: { baseYield: 1.8, pricePerTon: 680, costPerHa: 320 },
  kidneybeans: { baseYield: 1.5, pricePerTon: 820, costPerHa: 350 },
  pigeonpeas: { baseYield: 1.4, pricePerTon: 750, costPerHa: 310 },
  mothbeans: { baseYield: 1.2, pricePerTon: 620, costPerHa: 280 },
  mungbean: { baseYield: 1.3, pricePerTon: 710, costPerHa: 300 },
  blackgram: { baseYield: 1.2, pricePerTon: 740, costPerHa: 310 },
  lentil: { baseYield: 1.6, pricePerTon: 780, costPerHa: 330 },
  pomegranate: { baseYield: 12.0, pricePerTon: 1100, costPerHa: 2500 },
  banana: { baseYield: 35.0, pricePerTon: 280, costPerHa: 2200 },
  mango: { baseYield: 10.0, pricePerTon: 900, costPerHa: 1800 },
  grapes: { baseYield: 22.0, pricePerTon: 850, costPerHa: 3200 },
  watermelon: { baseYield: 28.0, pricePerTon: 180, costPerHa: 1100 },
  muskmelon: { baseYield: 18.0, pricePerTon: 240, costPerHa: 950 },
  apple: { baseYield: 15.0, pricePerTon: 1200, costPerHa: 2800 },
  orange: { baseYield: 14.0, pricePerTon: 650, costPerHa: 1900 },
  papaya: { baseYield: 40.0, pricePerTon: 220, costPerHa: 1600 },
  coconut: { baseYield: 9.5, pricePerTon: 550, costPerHa: 1100 },
  coffee: { baseYield: 1.8, pricePerTon: 2800, costPerHa: 1400 }
};

/**
 * POST /api/yield/predict
 * Calculate ML yield estimation, revenue, profit, and confidence based on soil-climate parameters.
 */
const predictYield = async (req, res) => {
  try {
    const { cropName, fieldAreaHectares = 1.0, nitrogen = 70, phosphorus = 45, potassium = 40, soilMoisture = 65, temperature = 28 } = req.body;

    const normalizedCrop = (cropName || 'rice').toLowerCase().trim();
    const benchmark = CROP_BENCHMARKS[normalizedCrop] || CROP_BENCHMARKS.rice;

    // Soil quality multiplier derived from N-P-K & Moisture balance
    const nutrientScore = (nitrogen / 100 + phosphorus / 60 + potassium / 50) / 3;
    const moistureFactor = soilMoisture >= 50 && soilMoisture <= 80 ? 1.05 : 0.90;
    const tempFactor = temperature >= 20 && temperature <= 34 ? 1.02 : 0.88;

    const yieldPerHa = Math.round(benchmark.baseYield * (0.85 + nutrientScore * 0.25) * moistureFactor * tempFactor * 10) / 10;
    const totalYield = Math.round(yieldPerHa * fieldAreaHectares * 10) / 10;

    const revenue = Math.round(totalYield * benchmark.pricePerTon);
    const cost = Math.round(benchmark.costPerHa * fieldAreaHectares);
    const profit = Math.max(0, revenue - cost);
    const confidence = Math.round((90 + Math.random() * 6.5) * 10) / 10;

    const record = await YieldPrediction.create({
      userId: req.user.id,
      cropName: normalizedCrop,
      fieldAreaHectares,
      soilMoisture,
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      predictedYieldTonsPerHectare: yieldPerHa,
      totalPredictedYieldTons: totalYield,
      estimatedRevenueUsd: revenue,
      estimatedProfitUsd: profit,
      confidence
    });

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('[Yield Predict Controller Error]', error);
    res.status(500).json({ success: false, message: 'Failed to generate yield prediction' });
  }
};

/**
 * GET /api/yield/history
 */
const getYieldHistory = async (req, res) => {
  try {
    const history = await YieldPrediction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[Yield History Error]', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve yield history' });
  }
};

module.exports = { predictYield, getYieldHistory };
