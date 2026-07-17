import React, { useState, useEffect } from 'react';
import { predictionAPI } from '../services/api';
import useWeather from '../hooks/useWeather';
import useIoT from '../hooks/useIoT';
import PredictionForm from '../components/PredictionForm';
import PredictionResult from '../components/PredictionResult';
import toast from 'react-hot-toast';

const initialFormState = {
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  temperature: '',
  humidity: '',
  ph: '',
  rainfall: ''
};

const Predict = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Get weather and IoT data to populate form
  const { weather, detectAndFetchWeather } = useWeather();
  const { sensorData, stopAutoRefresh } = useIoT(true, 5000);

  // Stop IoT auto-refresh when leaving page or getting a result
  useEffect(() => {
    if (result) {
      stopAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [result, stopAutoRefresh]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handlePopulateWeather = async () => {
    if (!weather) {
      await detectAndFetchWeather();
      // Need to wait for state update, so we handle it in useEffect or just use toast for now
      toast.success('Fetching weather data...');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainfall: weather.rainfall
    }));
    toast.success('Populated environmental data from OpenWeather API');
  };

  const handlePopulateIoT = () => {
    if (!sensorData) {
      toast.error('Waiting for IoT sensor connection...');
      return;
    }
    
    const { sensors } = sensorData;
    setFormData({
      nitrogen: sensors.nitrogen.value,
      phosphorus: sensors.phosphorus.value,
      potassium: sensors.potassium.value,
      temperature: sensors.temperature.value,
      humidity: sensors.humidity.value,
      ph: sensors.ph.value,
      rainfall: formData.rainfall // IoT doesn't provide rainfall usually, keep existing
    });
    toast.success('Populated all fields from Live IoT Sensors');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Include weather context if available
      const payload = {
        ...formData,
        weatherData: weather ? {
          condition: weather.condition,
          icon: weather.icon,
          location: weather.location
        } : undefined
      };

      const res = await predictionAPI.predict(payload);
      setResult(res.data.data.prediction);
      toast.success('Prediction generated successfully!');
      
      // Scroll to top to see result
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Prediction failed. Please try again.';
      toast.error(msg);
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData(initialFormState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          AI Crop <span className="gradient-text">Prediction</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Enter your soil and environmental data to get intelligent crop recommendations powered by our Random Forest & XGBoost ensemble model.
        </p>
      </div>

      {result ? (
        <PredictionResult result={result} onReset={handleReset} />
      ) : (
        <PredictionForm 
          formData={formData}
          handleInputChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={loading}
          onPopulateWeather={handlePopulateWeather}
          onPopulateIoT={handlePopulateIoT}
          hasWeatherData={!!weather}
          hasIotData={!!sensorData}
        />
      )}
    </div>
  );
};

export default Predict;
