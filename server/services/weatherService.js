const axios = require('axios');

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetch current weather from OpenWeather API
 * Falls back to mock data if no API key is configured
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object} Weather data
 */
const getWeather = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  // If no API key, return realistic mock data
  if (!apiKey || apiKey === 'your_openweather_api_key_here') {
    console.log('⚠️  No OpenWeather API key — returning simulated weather data');
    return generateMockWeather(lat, lon);
  }

  try {
    const response = await axios.get(OPENWEATHER_BASE, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'metric' // Celsius
      },
      timeout: 10000
    });

    const data = response.data;

    return {
      temperature: Math.round(data.main.temp * 100) / 100,
      humidity: data.main.humidity,
      rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      location: data.name,
      country: data.sys.country,
      feelsLike: data.main.feels_like,
      visibility: data.visibility,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('OpenWeather API error:', error.message);
    // Fall back to mock data on error
    return generateMockWeather(lat, lon);
  }
};

/**
 * Generate realistic mock weather data based on latitude
 */
const generateMockWeather = (lat, lon) => {
  // Temperature varies by latitude (warmer near equator)
  const baseTemp = 35 - Math.abs(lat) * 0.5;
  const temperature = Math.round((baseTemp + (Math.random() * 8 - 4)) * 100) / 100;
  const humidity = Math.round(55 + Math.random() * 35);

  const conditions = [
    { main: 'Clear', description: 'clear sky', icon: '01d' },
    { main: 'Clouds', description: 'scattered clouds', icon: '03d' },
    { main: 'Clouds', description: 'overcast clouds', icon: '04d' },
    { main: 'Rain', description: 'light rain', icon: '10d' },
    { main: 'Rain', description: 'moderate rain', icon: '10d' },
    { main: 'Drizzle', description: 'light drizzle', icon: '09d' },
  ];

  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const isRaining = condition.main === 'Rain' || condition.main === 'Drizzle';
  const rainfall = isRaining ? Math.round(Math.random() * 150 + 50) : Math.round(Math.random() * 30);

  return {
    temperature,
    humidity,
    rainfall,
    condition: condition.main,
    description: condition.description,
    icon: condition.icon,
    windSpeed: Math.round(Math.random() * 15 * 100) / 100,
    pressure: Math.round(1005 + Math.random() * 20),
    location: 'Simulated Location',
    country: 'IN',
    feelsLike: Math.round((temperature + (Math.random() * 4 - 2)) * 100) / 100,
    visibility: Math.round(5000 + Math.random() * 5000),
    timestamp: new Date().toISOString(),
    simulated: true
  };
};

module.exports = { getWeather };
