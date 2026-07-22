import { useState, useEffect, useCallback } from 'react';
import { weatherAPI } from '../services/api';

const WEATHER_CACHE_KEY = 'ai_crop_weather_cache';
const CACHE_TTL_MS = 12 * 60 * 1000; // 12 Minutes Cache TTL

const useWeather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (lat, lon, force = false) => {
    // Check localStorage cache first unless forced
    if (!force) {
      try {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS) {
            setWeather(data);
            return;
          }
        }
      } catch {
        // Cache parse error
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await weatherAPI.getWeather(lat, lon);
      const weatherData = res.data.data;

      setWeather(weatherData);

      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        data: weatherData,
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch real-time weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const detectAndFetchWeather = useCallback((force = true) => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude, force);
        },
        (err) => {
          console.warn('[Geolocation] Permission denied or unavailable, using fallback coordinates:', err.message);
          fetchWeather(28.6139, 77.2090, force);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      fetchWeather(28.6139, 77.2090, force);
    }
  }, [fetchWeather]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mounted) fetchWeather(position.coords.latitude, position.coords.longitude, false);
          },
          () => {
            if (mounted) fetchWeather(28.6139, 77.2090, false);
          },
          { timeout: 8000 }
        );
      } else {
        if (mounted) fetchWeather(28.6139, 77.2090, false);
      }
    }, 0);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchWeather]);

  // Periodic auto-refresh every 12 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      detectAndFetchWeather(true);
    }, CACHE_TTL_MS);

    return () => clearInterval(interval);
  }, [detectAndFetchWeather]);

  return { weather, loading, error, fetchWeather, detectAndFetchWeather };
};

export default useWeather;
