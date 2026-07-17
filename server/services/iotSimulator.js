/**
 * IoT Sensor Simulator
 * Generates realistic, time-varying virtual sensor readings
 * that simulate agricultural IoT devices monitoring soil and environment.
 */

// Base values that drift over time
let driftState = {
  soilMoisture: 45,
  temperature: 28,
  humidity: 65,
  nitrogen: 60,
  phosphorus: 45,
  potassium: 40,
  ph: 6.5,
  lastUpdate: Date.now()
};

/**
 * Apply smooth drift with sinusoidal variation + random noise
 * @param {number} current - Current value
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @param {number} driftRate - How much the value can change per call
 * @returns {number} New value
 */
const drift = (current, min, max, driftRate = 0.5) => {
  const time = Date.now() / 1000;
  // Sinusoidal component (simulates daily cycles)
  const sinComponent = Math.sin(time / 300) * driftRate * 2;
  // Random noise
  const noise = (Math.random() - 0.5) * driftRate * 3;
  // Combined
  let newValue = current + sinComponent + noise;
  // Clamp to bounds
  newValue = Math.max(min, Math.min(max, newValue));
  return Math.round(newValue * 100) / 100;
};

/**
 * Generate a complete set of simulated sensor readings
 * @returns {Object} Sensor data object
 */
const generateSensorData = () => {
  // Update drift state
  driftState.soilMoisture = drift(driftState.soilMoisture, 20, 80, 0.8);
  driftState.temperature = drift(driftState.temperature, 15, 42, 0.3);
  driftState.humidity = drift(driftState.humidity, 30, 95, 0.6);
  driftState.nitrogen = drift(driftState.nitrogen, 10, 140, 0.4);
  driftState.phosphorus = drift(driftState.phosphorus, 5, 145, 0.3);
  driftState.potassium = drift(driftState.potassium, 5, 210, 0.3);
  driftState.ph = drift(driftState.ph, 4.0, 9.0, 0.02);
  driftState.lastUpdate = Date.now();

  // Determine sensor statuses based on values
  const getSoilMoistureStatus = (val) => {
    if (val < 30) return { status: 'low', label: 'Dry — irrigation needed' };
    if (val > 70) return { status: 'high', label: 'Saturated — reduce watering' };
    return { status: 'optimal', label: 'Optimal moisture level' };
  };

  const getPhStatus = (val) => {
    if (val < 5.5) return { status: 'acidic', label: 'Too acidic — apply lime' };
    if (val > 7.5) return { status: 'alkaline', label: 'Too alkaline — apply sulfur' };
    return { status: 'optimal', label: 'Optimal pH range' };
  };

  const getTempStatus = (val) => {
    if (val < 18) return { status: 'cold', label: 'Below optimal temperature' };
    if (val > 35) return { status: 'hot', label: 'Heat stress risk' };
    return { status: 'optimal', label: 'Optimal temperature' };
  };

  return {
    sensors: {
      soilMoisture: {
        value: driftState.soilMoisture,
        unit: '%',
        ...getSoilMoistureStatus(driftState.soilMoisture)
      },
      temperature: {
        value: driftState.temperature,
        unit: '°C',
        ...getTempStatus(driftState.temperature)
      },
      humidity: {
        value: driftState.humidity,
        unit: '%',
        status: driftState.humidity > 80 ? 'high' : driftState.humidity < 40 ? 'low' : 'optimal',
        label: driftState.humidity > 80 ? 'High humidity' : driftState.humidity < 40 ? 'Low humidity' : 'Normal humidity'
      },
      nitrogen: {
        value: driftState.nitrogen,
        unit: 'kg/ha',
        status: driftState.nitrogen < 30 ? 'low' : driftState.nitrogen > 100 ? 'high' : 'optimal',
        label: driftState.nitrogen < 30 ? 'Low nitrogen' : driftState.nitrogen > 100 ? 'High nitrogen' : 'Normal nitrogen'
      },
      phosphorus: {
        value: driftState.phosphorus,
        unit: 'kg/ha',
        status: driftState.phosphorus < 20 ? 'low' : driftState.phosphorus > 100 ? 'high' : 'optimal',
        label: driftState.phosphorus < 20 ? 'Low phosphorus' : driftState.phosphorus > 100 ? 'High phosphorus' : 'Normal phosphorus'
      },
      potassium: {
        value: driftState.potassium,
        unit: 'kg/ha',
        status: driftState.potassium < 20 ? 'low' : driftState.potassium > 150 ? 'high' : 'optimal',
        label: driftState.potassium < 20 ? 'Low potassium' : driftState.potassium > 150 ? 'High potassium' : 'Normal potassium'
      },
      ph: {
        value: driftState.ph,
        unit: '',
        ...getPhStatus(driftState.ph)
      }
    },
    deviceInfo: {
      deviceId: 'AGRI-SENSOR-001',
      battery: Math.round(75 + Math.random() * 20),
      signalStrength: Math.round(-40 - Math.random() * 30),
      firmware: 'v2.4.1'
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = { generateSensorData };
