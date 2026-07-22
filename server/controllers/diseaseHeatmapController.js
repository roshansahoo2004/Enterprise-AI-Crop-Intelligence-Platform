const DiseaseReport = require('../models/DiseaseReport');

/**
 * Agronomic regions in India with coordinates & baseline disease data
 */
const INDIAN_REGIONS = [
  { region: 'Punjab & Haryana', lat: 30.7333, lon: 76.7794, state: 'Punjab', activeOutbreaks: 12, riskLevel: 'Medium', primaryDisease: 'Rice Leaf Blast' },
  { region: 'Uttar Pradesh (Indo-Gangetic)', lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh', activeOutbreaks: 28, riskLevel: 'High', primaryDisease: 'Late Blight Potato' },
  { region: 'Maharashtra (Deccan Plateau)', lat: 19.7515, lon: 75.7139, state: 'Maharashtra', activeOutbreaks: 19, riskLevel: 'High', primaryDisease: 'Cotton Bacterial Blight' },
  { region: 'Gujarat (Saurashtra)', lat: 22.2587, lon: 71.1924, state: 'Gujarat', activeOutbreaks: 8, riskLevel: 'Low', primaryDisease: 'Groundnut Leaf Spot' },
  { region: 'Karnataka & Andhra', lat: 15.3173, lon: 75.7139, state: 'Karnataka', activeOutbreaks: 15, riskLevel: 'Medium', primaryDisease: 'Tomato Early Blight' },
  { region: 'Tamil Nadu (Cauvery Delta)', lat: 11.1271, lon: 78.6569, state: 'Tamil Nadu', activeOutbreaks: 22, riskLevel: 'High', primaryDisease: 'Rice Tungro Virus' },
  { region: 'West Bengal & Assam', lat: 22.9868, lon: 87.8550, state: 'West Bengal', activeOutbreaks: 31, riskLevel: 'Critical', primaryDisease: 'Jute Stem Rot' },
  { region: 'Madhya Pradesh (Malwa)', lat: 22.9734, lon: 78.6569, state: 'Madhya Pradesh', activeOutbreaks: 11, riskLevel: 'Low', primaryDisease: 'Soybean Rust' }
];

/**
 * GET /api/disease-heatmap/regions
 */
const getRegionData = async (req, res) => {
  try {
    const userScans = await DiseaseReport.find().limit(100);

    const regions = INDIAN_REGIONS.map(r => ({
      ...r,
      totalScans: r.activeOutbreaks * 4 + userScans.length
    }));

    res.json({
      success: true,
      data: regions
    });
  } catch (error) {
    console.error('[Disease Heatmap Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch regional disease heatmap data' });
  }
};

/**
 * GET /api/disease-heatmap/trends
 */
const getDiseaseTrends = async (req, res) => {
  try {
    const weeklyTrends = [
      { week: 'Week 1', leafBlight: 45, stemRot: 20, rust: 12, healthy: 120 },
      { week: 'Week 2', leafBlight: 52, stemRot: 24, rust: 18, healthy: 115 },
      { week: 'Week 3', leafBlight: 38, stemRot: 19, rust: 15, healthy: 130 },
      { week: 'Week 4', leafBlight: 29, stemRot: 14, rust: 9, healthy: 145 }
    ];

    res.json({
      success: true,
      data: weeklyTrends
    });
  } catch (error) {
    console.error('[Disease Trends Error]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch disease trends' });
  }
};

module.exports = { getRegionData, getDiseaseTrends };
