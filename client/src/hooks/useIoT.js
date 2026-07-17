import { useState, useEffect, useCallback, useRef } from 'react';
import { iotAPI } from '../services/api';

const useIoT = (autoRefresh = true, intervalMs = 3000) => {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchSensorData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await iotAPI.getSensorData();
      setSensorData(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sensor data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchSensorData();

    // Auto-refresh if enabled
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchSensorData, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, intervalMs, fetchSensorData]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { sensorData, loading, error, fetchSensorData, stopAutoRefresh };
};

export default useIoT;
