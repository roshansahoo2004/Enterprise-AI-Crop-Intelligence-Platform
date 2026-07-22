const axios = require('axios');

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';
const OPENMETEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';

// Simple In-Memory Weather Cache (12 min TTL)
const weatherCache = new Map();
const CACHE_TTL = 12 * 60 * 1000;

// WMO Weather Code map for Open-Meteo API
const WMO_CODES = {
  0: { condition: 'Clear', description: 'Clear sky', icon: '01d' },
  1: { condition: 'Clear', description: 'Mainly clear', icon: '01d' },
  2: { condition: 'Clouds', description: 'Partly cloudy', icon: '02d' },
  3: { condition: 'Clouds', description: 'Overcast', icon: '04d' },
  45: { condition: 'Fog', description: 'Foggy', icon: '50d' },
  48: { condition: 'Fog', description: 'Depositing rime fog', icon: '50d' },
  51: { condition: 'Drizzle', description: 'Light drizzle', icon: '09d' },
  53: { condition: 'Drizzle', description: 'Moderate drizzle', icon: '09d' },
  55: { condition: 'Drizzle', description: 'Dense drizzle', icon: '09d' },
  61: { condition: 'Rain', description: 'Slight rain', icon: '10d' },
  63: { condition: 'Rain', description: 'Moderate rain', icon: '10d' },
  65: { condition: 'Rain', description: 'Heavy rain', icon: '10d' },
  80: { condition: 'Rain', description: 'Slight rain showers', icon: '09d' },
  81: { condition: 'Rain', description: 'Moderate rain showers', icon: '09d' },
  82: { condition: 'Rain', description: 'Violent rain showers', icon: '09d' },
  95: { condition: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' }
};

/**
 * Reverse geocode latitude and longitude to City, State, Country
 */
const reverseGeocode = async (lat, lon) => {
  try {
    const response = await axios.get(NOMINATIM_BASE, {
      params: {
        lat,
        lon,
        format: 'json',
        zoom: 10
      },
      headers: {
        'User-Agent': 'AICropPlanningSystem/1.0'
      },
      timeout: 5000
    });

    const addr = response.data.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.suburb || 'Local Region';
    const state = addr.state || '';
    const country = addr.country_code ? addr.country_code.toUpperCase() : 'IN';

    return {
      location: state ? `${city}, ${state}` : city,
      country
    };
  } catch (_err) {
    return {
      location: 'Local Agronomic Zone',
      country: 'IN'
    };
  }
};

/**
 * Fetch current weather from OpenWeather API or Open-Meteo API with in-memory caching
 */
const getWeather = async (lat, lon) => {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  let weatherResult = null;

  // 1. Try OpenWeather API if valid API key is present
  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    try {
      const response = await axios.get(OPENWEATHER_BASE, {
        params: { lat, lon, appid: apiKey, units: 'metric' },
        timeout: 8000
      });

      const data = response.data;
      weatherResult = {
        temperature: Math.round(data.main.temp * 10) / 10,
        humidity: data.main.humidity,
        rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
        rainProbability: data.pop ? Math.round(data.pop * 100) : (data.rain ? 80 : 15),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        pressure: data.main.pressure,
        location: data.name,
        country: data.sys.country,
        feelsLike: Math.round(data.main.feels_like * 10) / 10,
        timestamp: new Date().toISOString(),
        isLive: true,
        source: 'OpenWeather'
      };
    } catch (err) {
      console.warn('[Weather Service] OpenWeather API failed, falling back to Open-Meteo:', err.message);
    }
  }

  // 2. Fetch real-time weather from Open-Meteo API if OpenWeather didn't execute
  if (!weatherResult) {
    try {
      const [weatherRes, geoInfo] = await Promise.all([
        axios.get(OPENMETEO_BASE, {
          params: {
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
            hourly: 'precipitation_probability',
            forecast_days: 1
          },
          timeout: 8000
        }),
        reverseGeocode(lat, lon)
      ]);

      const current = weatherRes.data.current || {};
      const hourly = weatherRes.data.hourly || {};

      const codeInfo = WMO_CODES[current.weather_code] || {
        condition: 'Clear',
        description: 'Clear sky',
        icon: '01d'
      };

      const maxRainProb = hourly.precipitation_probability
        ? Math.max(...hourly.precipitation_probability.slice(0, 12))
        : 20;

      weatherResult = {
        temperature: Math.round(current.temperature_2m * 10) / 10,
        humidity: Math.round(current.relative_humidity_2m),
        rainfall: Math.round(current.precipitation * 10) / 10,
        rainProbability: maxRainProb,
        condition: codeInfo.condition,
        description: codeInfo.description,
        icon: codeInfo.icon,
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        pressure: 1013,
        location: geoInfo.location,
        country: geoInfo.country,
        feelsLike: Math.round(current.temperature_2m * 10) / 10,
        timestamp: new Date().toISOString(),
        isLive: true,
        source: 'Open-Meteo Realtime'
      };
    } catch (openMeteoErr) {
      console.warn('[Weather Service] Open-Meteo API failed, generating fallback data:', openMeteoErr.message);
      weatherResult = generateMockWeather(lat, lon);
    }
  }

  // Store in cache
  weatherCache.set(cacheKey, {
    data: weatherResult,
    timestamp: Date.now()
  });

  return weatherResult;
};

/**
 * Generate fallback weather data
 */
const generateMockWeather = (lat, lon) => {
  const baseTemp = 30 - Math.abs(lat) * 0.3;
  const temperature = Math.round((baseTemp + (Math.random() * 4 - 2)) * 10) / 10;
  const humidity = Math.round(60 + Math.random() * 25);

  return {
    temperature,
    humidity,
    rainfall: Math.round(Math.random() * 15 * 10) / 10,
    rainProbability: Math.round(20 + Math.random() * 40),
    condition: 'Partly Cloudy',
    description: 'scattered clouds',
    icon: '03d',
    windSpeed: Math.round((2.5 + Math.random() * 4) * 10) / 10,
    pressure: 1012,
    location: 'Agronomic Field Station',
    country: 'IN',
    feelsLike: temperature,
    timestamp: new Date().toISOString(),
    isLive: false,
    simulated: true,
    source: 'Agronomic Simulator'
  };
};

module.exports = { getWeather };
