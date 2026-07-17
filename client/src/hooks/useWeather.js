import { useState, useEffect, useCallback } from 'react';
import { weatherAPI } from '../services/api';

const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const res = await weatherAPI.getWeather(lat, lon);
      setWeather(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const detectAndFetchWeather = useCallback(() => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation failed, using default coordinates:', err);
          // Default to New Delhi coordinates
          fetchWeather(28.6139, 77.2090);
        },
        { timeout: 10000 }
      );
    } else {
      // Fallback coordinates
      fetchWeather(28.6139, 77.2090);
    }
  }, [fetchWeather]);

  return { weather, loading, error, fetchWeather, detectAndFetchWeather };
};

export default useWeather;
