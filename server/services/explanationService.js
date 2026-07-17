/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  Phase-8 Step-3: Explainable AI — SHAP-based Explanation Service
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Generates structured explanation objects for crop predictions.
 *  Uses a persistent background Python subprocess running explain_persistent.py
 *  to cache model & TreeExplainer instances in memory.
 *
 *  If SHAP computation fails, automatically falls back to Rule-Based XAI
 *  heuristics without affecting crop prediction endpoints.
 * ══════════════════════════════════════════════════════════════════════════════
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Module Level Subprocess Variables ──────────────────────────────────────
let pythonProcess = null;
let activeModelPath = null;
let activeExplainerPath = null;
const pendingRequests = new Map();
let nextReqId = 0;

// ─── Optimal Ranges per Crop (Fallback Engine) ──────────────────────────────
const CROP_OPTIMAL_RANGES = {
  rice:         { nitrogen: [60, 100], phosphorus: [35, 60], potassium: [35, 50], temperature: [20, 27], humidity: [80, 95], ph: [5.5, 7.0], rainfall: [200, 300] },
  maize:        { nitrogen: [60, 100], phosphorus: [35, 60], potassium: [15, 30], temperature: [18, 27], humidity: [55, 75], ph: [5.5, 7.5], rainfall: [60, 110] },
  chickpea:     { nitrogen: [20, 60],  phosphorus: [55, 80], potassium: [70, 85], temperature: [15, 22], humidity: [14, 20], ph: [6.5, 8.0], rainfall: [60, 100] },
  kidneybeans:  { nitrogen: [15, 35],  phosphorus: [55, 75], potassium: [15, 30], temperature: [15, 22], humidity: [18, 25], ph: [5.5, 7.0], rainfall: [60, 120] },
  pigeonpeas:   { nitrogen: [15, 40],  phosphorus: [55, 75], potassium: [15, 25], temperature: [18, 36], humidity: [30, 65], ph: [4.5, 7.5], rainfall: [120, 200] },
  mothbeans:    { nitrogen: [15, 35],  phosphorus: [40, 60], potassium: [15, 25], temperature: [24, 32], humidity: [40, 65], ph: [3.5, 8.0], rainfall: [30, 70] },
  mungbean:     { nitrogen: [15, 35],  phosphorus: [40, 60], potassium: [15, 25], temperature: [25, 32], humidity: [80, 95], ph: [5.5, 7.5], rainfall: [30, 60] },
  blackgram:    { nitrogen: [25, 50],  phosphorus: [55, 75], potassium: [15, 25], temperature: [25, 35], humidity: [60, 75], ph: [5.5, 8.0], rainfall: [55, 80] },
  lentil:       { nitrogen: [15, 30],  phosphorus: [55, 80], potassium: [15, 25], temperature: [18, 28], humidity: [20, 65], ph: [5.5, 8.0], rainfall: [35, 55] },
  pomegranate:  { nitrogen: [15, 35],  phosphorus: [5, 20],  potassium: [30, 45], temperature: [18, 26], humidity: [85, 95], ph: [5.5, 7.5], rainfall: [100, 120] },
  banana:       { nitrogen: [80, 120], phosphorus: [70, 85], potassium: [45, 55], temperature: [25, 30], humidity: [75, 85], ph: [5.5, 7.0], rainfall: [90, 120] },
  mango:        { nitrogen: [15, 35],  phosphorus: [15, 35], potassium: [25, 40], temperature: [27, 36], humidity: [45, 65], ph: [4.5, 7.0], rainfall: [90, 110] },
  grapes:       { nitrogen: [15, 35],  phosphorus: [120, 145],potassium: [195, 210],temperature: [8, 14],  humidity: [80, 84], ph: [5.5, 7.0], rainfall: [65, 75] },
  watermelon:   { nitrogen: [80, 110], phosphorus: [15, 25], potassium: [45, 55], temperature: [24, 28], humidity: [80, 90], ph: [6.0, 7.0], rainfall: [45, 55] },
  muskmelon:    { nitrogen: [80, 110], phosphorus: [15, 25], potassium: [45, 55], temperature: [27, 30], humidity: [90, 95], ph: [6.0, 7.0], rainfall: [20, 30] },
  apple:        { nitrogen: [15, 35],  phosphorus: [120, 140],potassium: [195, 210],temperature: [21, 25], humidity: [90, 95], ph: [5.5, 7.0], rainfall: [100, 120] },
  orange:       { nitrogen: [15, 30],  phosphorus: [5, 15],  potassium: [5, 15],  temperature: [15, 25], humidity: [90, 95], ph: [6.0, 8.0], rainfall: [100, 120] },
  papaya:       { nitrogen: [35, 65],  phosphorus: [55, 75], potassium: [45, 55], temperature: [20, 35], humidity: [90, 95], ph: [6.0, 7.0], rainfall: [130, 170] },
  coconut:      { nitrogen: [15, 30],  phosphorus: [5, 15],  potassium: [25, 35], temperature: [25, 30], humidity: [90, 97], ph: [5.5, 7.0], rainfall: [130, 200] },
  cotton:       { nitrogen: [100, 140],phosphorus: [40, 55], potassium: [15, 25], temperature: [22, 28], humidity: [75, 85], ph: [6.0, 8.0], rainfall: [60, 100] },
  jute:         { nitrogen: [60, 100], phosphorus: [40, 55], potassium: [35, 45], temperature: [23, 28], humidity: [75, 90], ph: [6.0, 8.0], rainfall: [150, 200] },
  coffee:       { nitrogen: [80, 120], phosphorus: [15, 30], potassium: [25, 35], temperature: [23, 28], humidity: [55, 70], ph: [6.0, 7.0], rainfall: [140, 180] },
};

const FEATURE_LABELS = {
  nitrogen:    'Nitrogen',
  phosphorus:  'Phosphorus',
  potassium:   'Potassium',
  temperature: 'Temperature',
  humidity:    'Humidity',
  ph:          'Soil pH',
  rainfall:    'Rainfall'
};

const BASE_FEATURE_WEIGHTS = {
  nitrogen:    0.22,
  rainfall:    0.20,
  temperature: 0.16,
  humidity:    0.14,
  ph:          0.12,
  phosphorus:  0.09,
  potassium:   0.07
};

// ─── Subprocess Manager Functions ───────────────────────────────────────────
function getPythonCmd() {
  return process.platform === 'win32' ? 'python' : 'python3';
}

function startPythonProcess(modelPath, scalerPath, encoderPath, explainerPath) {
  if (pythonProcess) {
    try {
      pythonProcess.kill();
    } catch (err) {}
  }

  const scriptPath = path.join(__dirname, '..', '..', 'ml', 'explain_persistent.py');
  const pythonCmd = getPythonCmd();

  console.log(`[XAI Service] Spawning persistent SHAP process with model: ${modelPath}`);
  
  pythonProcess = spawn(pythonCmd, [scriptPath, modelPath, scalerPath, encoderPath, explainerPath], {
    windowsHide: true
  });

  activeModelPath = modelPath;
  activeExplainerPath = explainerPath;

  let buffer = '';

  pythonProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    let lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      try {
        const resObj = JSON.parse(line);
        
        // Check if this is the startup status line
        if (resObj.status && resObj.model_path) {
          console.log(`[XAI Service] Persistent subprocess status: ${resObj.status}. Error: ${resObj.error}`);
          continue;
        }

        const reqId = resObj.reqId;
        if (reqId && pendingRequests.has(reqId)) {
          const { resolve, timer } = pendingRequests.get(reqId);
          clearTimeout(timer);
          pendingRequests.delete(reqId);
          resolve(resObj);
        }
      } catch (err) {
        console.error('[XAI Service] Error parsing stdout line:', err.message, 'Line:', line);
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[XAI Service Subprocess Stderr] ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    console.warn(`[XAI Service] Persistent subprocess exited with code ${code}`);
    pythonProcess = null;
    
    // Fail all pending queries gracefully (will trigger fallback)
    for (let [reqId, { resolve, timer }] of pendingRequests.entries()) {
      clearTimeout(timer);
      resolve({ shapAvailable: false, error: 'Subprocess exited' });
    }
    pendingRequests.clear();
  });

  pythonProcess.on('error', (err) => {
    console.error('[XAI Service] Failed to start persistent subprocess:', err.message);
    pythonProcess = null;
  });
}

function querySHAP(features, predictedCrop) {
  return new Promise((resolve) => {
    if (!pythonProcess) {
      return resolve({ shapAvailable: false, error: 'Subprocess not running' });
    }

    const reqId = String(++nextReqId);
    
    // Ensure prediction NEVER blocks if SHAP hangs (3 seconds timeout)
    const timer = setTimeout(() => {
      if (pendingRequests.has(reqId)) {
        pendingRequests.delete(reqId);
        console.warn(`[XAI Service] SHAP query timed out for reqId: ${reqId}`);
        resolve({ shapAvailable: false, error: 'Query timed out' });
      }
    }, 3000);

    pendingRequests.set(reqId, { resolve, timer });

    const queryObj = {
      reqId,
      features,
      predicted_crop: predictedCrop
    };

    try {
      pythonProcess.stdin.write(JSON.stringify(queryObj) + '\n');
    } catch (err) {
      clearTimeout(timer);
      pendingRequests.delete(reqId);
      resolve({ shapAvailable: false, error: `Stdin write failure: ${err.message}` });
    }
  });
}

// ─── Rule-Based Fallback Engine Helpers ─────────────────────────────────────
function evaluateFeature(value, range) {
  const [min, max] = range;
  const rangeWidth = max - min || 1;
  const tolerance = rangeWidth * 0.25;

  if (value >= min && value <= max) {
    const center = (min + max) / 2;
    const distFromCenter = Math.abs(value - center);
    const maxDist = rangeWidth / 2;
    const fitScore = 1.0 - (distFromCenter / maxDist) * 0.2; // 0.8–1.0
    return { direction: 'positive', fitScore };
  }

  if (value >= min - tolerance && value <= max + tolerance) {
    const distOutside = value < min ? min - value : value - max;
    const fitScore = 0.6 - (distOutside / tolerance) * 0.3; // 0.3–0.6
    return { direction: 'neutral', fitScore: Math.max(0.3, fitScore) };
  }

  const distOutside = value < min ? min - value : value - max;
  const severity = Math.min(1, distOutside / (rangeWidth * 2));
  const fitScore = Math.max(0.02, 0.25 * (1 - severity));
  return { direction: 'negative', fitScore };
}

function generateFeatureMessage(key, value, range, cropName) {
  const [min, max] = range;
  const label = FEATURE_LABELS[key];

  if (value >= min && value <= max) {
    let text = `${label} level is ideal for growth.`;
    if (key === 'nitrogen') text = `Nitrogen strongly supports ${cropName}.`;
    else if (key === 'ph') text = `Soil pH is ideal.`;
    else if (key === 'phosphorus') text = `Phosphorus level is ideal for healthy root development.`;
    else if (key === 'potassium') text = `Potassium level is within the optimal range.`;
    else if (key === 'temperature') text = `Temperature level is optimal for growth.`;
    else if (key === 'humidity') text = `Humidity level strongly supports ${cropName}.`;
    else if (key === 'rainfall') text = `Rainfall conditions are favourable for this crop.`;

    return { text, type: 'positive' };
  }

  const rangeWidth = max - min || 1;
  const tolerance = rangeWidth * 0.25;

  if (value >= min - tolerance && value <= max + tolerance) {
    let text = `${label} level is acceptable.`;
    if (key === 'nitrogen') text = `Nitrogen level is acceptable but could be optimized.`;
    else if (key === 'ph') text = `Soil pH is close to the optimal range.`;
    else if (key === 'phosphorus') text = `Phosphorus is near the boundary of the ideal range.`;
    else if (key === 'potassium') text = `Potassium level is acceptable.`;
    else if (key === 'temperature') text = `Temperature is slightly outside the ideal window.`;
    else if (key === 'humidity') text = `Humidity is acceptable.`;
    else if (key === 'rainfall') text = `Rainfall is within a tolerable range for ${cropName}.`;

    return { text, type: 'neutral' };
  }

  const isBelow = value < min;
  const directionStr = isBelow ? 'below' : 'above';
  const degreeStr = Math.abs(isBelow ? (min - value) : (value - max)) > (rangeWidth * 0.6) ? 'significantly' : 'slightly';
  const optimumLabel = isBelow ? 'optimum' : 'ideal';

  let text = `${label} level is ${degreeStr} ${directionStr} ${optimumLabel}.`;
  if (key === 'ph') {
    text = `Soil pH is ${degreeStr} ${directionStr} ideal limits.`;
  } else if (key === 'nitrogen') {
    text = `Nitrogen level is ${degreeStr} ${directionStr} recommended range.`;
  } else if (key === 'phosphorus') {
    text = `Phosphorus level is ${degreeStr} ${directionStr} recommended range.`;
  } else if (key === 'potassium') {
    text = `Potassium level is ${degreeStr} ${directionStr} recommended range.`;
  } else if (key === 'humidity') {
    text = `Humidity level is ${degreeStr} ${directionStr} optimum for ${cropName}.`;
  } else if (key === 'rainfall') {
    text = `Rainfall is ${degreeStr} ${directionStr} recommended level.`;
  }

  return { text, type: 'warning' };
}

function getConfidenceLevel(confidence) {
  if (confidence >= 95) return 'Very High';
  if (confidence >= 90) return 'High';
  if (confidence >= 70) return 'Medium';
  return 'Low';
}

function runRuleBasedFallback(inputData, cropName, confidence, modelVersion) {
  const cropKey = cropName?.toLowerCase();
  const ranges = CROP_OPTIMAL_RANGES[cropKey];
  const featureKeys = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall'];

  const evaluations = featureKeys.map((key) => {
    const value = parseFloat(inputData[key]) || 0;
    const baseWeight = BASE_FEATURE_WEIGHTS[key] || 0.1;

    if (ranges && ranges[key]) {
      const { direction, fitScore } = evaluateFeature(value, ranges[key]);
      const rawImpact = baseWeight * (0.4 + fitScore * 0.6);
      return { feature: FEATURE_LABELS[key], key, rawImpact, direction, value };
    }
    return { feature: FEATURE_LABELS[key], key, rawImpact: baseWeight * 0.5, direction: 'neutral', value };
  });

  const sorted = [...evaluations].sort((a, b) => b.rawImpact - a.rawImpact);
  const totalRawImpact = sorted.reduce((sum, e) => sum + e.rawImpact, 0) || 1;

  const topFactors = sorted.map((e) => ({
    feature: e.feature,
    impact: parseFloat((e.rawImpact / totalRawImpact).toFixed(2)),
    direction: e.direction
  }));

  const messages = sorted.slice(0, 5).map((e) => {
    if (ranges && ranges[e.key]) {
      return generateFeatureMessage(e.key, e.value, ranges[e.key], cropName);
    }
    return { text: `${e.feature} level is acceptable.`, type: 'neutral' };
  });

  return {
    confidenceLevel: getConfidenceLevel(confidence),
    messages,
    topFactors,
    generatedAt: new Date(),
    modelVersion,
    engine: 'Rule-Based Fallback',
    shapAvailable: false
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PUBLIC API — generateExplanation()
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function generateExplanation(inputData, predictedCrop, confidence, modelVersion = 'v1.0') {
  const cropName = predictedCrop ? (predictedCrop.charAt(0).toUpperCase() + predictedCrop.slice(1)) : 'this crop';

  // ── Step 1: Resolve Model Paths dynamically (Active Registry deployment check) ──
  const mlDir = path.join(__dirname, '..', '..', 'ml');
  let modelPath = path.join(mlDir, 'models', 'best_model.pkl');
  let scalerPath = path.join(mlDir, 'scalers', 'scaler.pkl');
  let encoderPath = path.join(mlDir, 'scalers', 'label_encoder.pkl');
  let explainerPath = path.join(mlDir, 'models', 'shap_explainer.pkl');

  try {
    const ModelRegistry = require('../models/ModelRegistry');
    const activeModel = await ModelRegistry.findOne({ status: 'ACTIVE' }).lean();
    if (activeModel && activeModel.filePath && activeModel.filePath.endsWith('.pkl')) {
      const resolvedPath = path.join(__dirname, '..', '..', activeModel.filePath);
      if (fs.existsSync(resolvedPath)) {
        modelPath = resolvedPath;
        const parentDir = path.dirname(resolvedPath);
        const baseName = path.basename(resolvedPath, '.pkl');
        const candidateExplainer = path.join(parentDir, `${baseName}_explainer.pkl`);
        if (fs.existsSync(candidateExplainer)) {
          explainerPath = candidateExplainer;
        }
      }
    }
  } catch (err) {
    console.error('[XAI Service] ModelRegistry active model query failed:', err.message);
  }

  // ── Step 2: Auto-restart Subprocess if model file changes ──
  if (!pythonProcess || activeModelPath !== modelPath || activeExplainerPath !== explainerPath) {
    startPythonProcess(modelPath, scalerPath, encoderPath, explainerPath);
  }

  // ── Step 3: Query persistent SHAP subprocess ──
  const features = [
    parseFloat(inputData.nitrogen),
    parseFloat(inputData.phosphorus),
    parseFloat(inputData.potassium),
    parseFloat(inputData.temperature),
    parseFloat(inputData.humidity),
    parseFloat(inputData.ph),
    parseFloat(inputData.rainfall)
  ];

  let shapResult = null;
  try {
    shapResult = await querySHAP(features, predictedCrop);
  } catch (err) {
    console.error('[XAI Service] Subprocess query error:', err.message);
  }

  // ── Step 4: Map SHAP contributions or trigger Rule-Based Fallback ──
  if (shapResult && shapResult.shapAvailable) {
    const messages = shapResult.featureContributions.slice(0, 5).map(contrib => {
      let text = `${contrib.feature} had minimal influence.`;
      if (contrib.direction === 'positive') {
        text = `${contrib.feature} strongly increased the probability of ${cropName}.`;
      } else if (contrib.direction === 'negative') {
        text = `${contrib.feature} slightly reduced confidence.`;
      }
      return {
        text,
        type: contrib.direction === 'positive' ? 'positive' : contrib.direction === 'negative' ? 'warning' : 'neutral'
      };
    });

    const topFactors = shapResult.featureContributions.map(contrib => ({
      feature: contrib.feature,
      impact: parseFloat((contrib.importance / 100).toFixed(2)),
      direction: contrib.direction
    }));

    return {
      confidenceLevel: getConfidenceLevel(confidence),
      messages,
      topFactors,
      generatedAt: new Date(),
      modelVersion,
      engine: 'SHAP Explainability',
      shapAvailable: true,
      baseValue: shapResult.baseValue,
      expectedValue: shapResult.expectedValue
    };
  }

  // Failure fallback path
  console.warn('[XAI Service] ⚠️ SHAP pipeline failed or returned unavailable. Triggering Rule-Based Fallback...');
  return runRuleBasedFallback(inputData, cropName, confidence, modelVersion);
}

module.exports = { generateExplanation };
