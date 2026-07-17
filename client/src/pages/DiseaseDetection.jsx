import React, { useState, useEffect, useRef } from 'react';
import { FiUploadCloud, FiImage, FiActivity, FiCheckCircle, FiAlertTriangle, FiInfo, FiArrowRight } from 'react-icons/fi';
import { diseaseAPI, feedbackAPI } from '../services/api';
import toast from 'react-hot-toast';

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);

  // Active Learning feedback states
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showIncorrectForm, setShowIncorrectForm] = useState(false);
  const [selectedCorrectDisease, setSelectedCorrectDisease] = useState('');
  const [diseaseClasses, setDiseaseClasses] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchDiseaseClasses();
  }, []);

  const fetchDiseaseClasses = async () => {
    try {
      const res = await feedbackAPI.getDiseaseClasses();
      setDiseaseClasses(res.data.data);
    } catch (error) {
      console.error('Failed to fetch disease classes:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await diseaseAPI.getHistory();
      setHistory(res.data.data);
    } catch (error) {
      console.error('Failed to fetch disease history:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null); // Clear previous result
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const res = await diseaseAPI.detectDisease(formData);
      console.log("Backend Response:", res.data);
      console.log("Result:", res.data.data);
      console.log("Model Version:", res.data.data.modelVersion);
      setResult(res.data.data);
      toast.success('Analysis complete!');

      // Reset active learning feedback states
      setFeedbackSubmitted(false);
      setShowIncorrectForm(false);
      setSelectedCorrectDisease('');
      setSearchTerm('');
      setIsOpen(false);

      fetchHistory(); // Refresh history
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze image');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    // Reset active learning feedback states
    setFeedbackSubmitted(false);
    setShowIncorrectForm(false);
    setSelectedCorrectDisease('');
    setSearchTerm('');
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFeedbackYes = async () => {
    if (!result) return;
    setLoadingFeedback(true);
    try {
      await feedbackAPI.submitFeedback({
        imageUrl: result.imageUrl,
        predictedDisease: result.disease,
        actualDisease: result.disease,
        confidence: result.confidence,
        correct: true
      });
      toast.success('Thanks for your feedback!');
      setFeedbackSubmitted(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(msg);
      console.error('Feedback submission error:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleFeedbackNoSubmit = async () => {
    if (!result || !selectedCorrectDisease) return;
    setLoadingFeedback(true);
    try {
      await feedbackAPI.submitFeedback({
        imageUrl: result.imageUrl,
        predictedDisease: result.disease,
        actualDisease: selectedCorrectDisease,
        confidence: result.confidence,
        correct: false
      });
      toast.success('Feedback submitted successfully.');
      setFeedbackSubmitted(true);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(msg);
      console.error('Feedback submission error:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Helper for severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'low':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'none':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 95) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  const getConfidenceStyles = (confidence) => {
    const level = getConfidenceLevel(confidence);
    switch (level) {
      case 'High':
        return {
          badge: 'text-green-400 bg-green-400/10 border-green-400/20',
          card: 'bg-green-500/5 border-green-500/20 text-green-300',
          title: '✅ High Confidence Prediction',
          message: 'The AI is highly confident about this diagnosis. You can still provide feedback if you notice any mistake.',
          caption: 'Feedback is optional.',
          noButton: 'px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50',
          pulseClass: ''
        };
      case 'Medium':
        return {
          badge: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
          card: 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300',
          title: '⚠ Please Verify This Prediction',
          message: 'The AI is moderately confident. Your feedback will help improve future predictions.',
          caption: 'We recommend verifying this prediction.',
          noButton: 'px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50',
          pulseClass: ''
        };
      case 'Low':
      default:
        return {
          badge: 'text-red-400 bg-red-400/10 border-red-400/20',
          card: 'bg-red-500/5 border-red-500/20 text-red-300',
          title: '🚨 AI is Uncertain',
          message: 'The AI is not confident about this diagnosis. Please verify the disease. Your feedback will directly improve the next model version.',
          caption: 'Feedback Recommended',
          noButton: 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-red-500/20 hover:scale-105 active:scale-100',
          pulseClass: 'pulse-border ring-1 ring-red-500/30'
        };
    }
  };

  const filteredClasses = diseaseClasses.filter(c =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <FiActivity className="text-primary-400" /> Plant <span className="gradient-text">Disease Detection</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Upload an image of a plant leaf to identify diseases instantly using our Deep Learning model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Upload Section */}
        <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px]">

          {!previewUrl ? (
            <div
              className="w-full h-full min-h-[300px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400 mb-4 group-hover:scale-110 transition-transform">
                <FiUploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Leaf Image</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Drag and drop or click to browse. Supported formats: JPEG, JPG, PNG.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl mb-6">
                <img src={previewUrl} alt="Leaf Preview" className="w-full h-auto object-cover max-h-[400px]" />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="btn-primary w-full max-w-md flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Image...
                  </>
                ) : (
                  <>Analyze Image <FiArrowRight /></>
                )}
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/jpeg, image/jpg, image/png"
            className="hidden"
          />
        </div>

        {/* Result Section */}
        <div className="glass-card p-6 md:p-8 flex flex-col h-full">
          <h2 className="text-xl font-display font-semibold text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
            <FiCheckCircle className="text-secondary-400" /> Detection Result
          </h2>

          {result ? (
            <div className="flex-1 flex flex-col animate-slide-up">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Identified Condition</p>
                  <h3 className="text-3xl font-display font-bold text-white capitalize">{result.disease}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(result.severity)}`}>
                    {result.severity} Severity
                  </span>
                </div>
              </div>

              <div className="bg-surface-900/50 rounded-xl p-4 border border-white/5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-medium">AI Confidence Model</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getConfidenceStyles(result.confidence).badge}`}>
                    {getConfidenceLevel(result.confidence)} Confidence
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2.5 bg-surface-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${result.confidence}%` }}></div>
                  </div>
                  <span className="text-white font-bold">{result.confidence}%</span>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <FiInfo className="text-primary-400" /> Recommended Treatment
                </h4>
                {result.treatment && result.treatment.length > 0 ? (
                  <ul className="space-y-3">
                    {result.treatment.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300 text-sm bg-surface-800/30 p-3 rounded-lg border border-white/5">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">No specific treatment found for this condition.</p>
                )}
              </div>

              {/* Active Learning Section */}
              <style>{`
                @keyframes pulseBorder {
                  0%, 100% { border-color: rgba(239, 68, 68, 0.2); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                  50% { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 0 8px 1px rgba(239, 68, 68, 0.15); }
                }
                .pulse-border {
                  animation: pulseBorder 2s infinite;
                  border-style: solid !important;
                }
              `}</style>
              <div className={`mt-8 pt-6 border-t border-white/10 ${!feedbackSubmitted ? getConfidenceStyles(result.confidence).pulseClass : ''}`}>
                {feedbackSubmitted ? (
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 flex items-center gap-3 text-primary-300">
                    <FiCheckCircle className="shrink-0 w-5 h-5 text-primary-400" />
                    <span className="text-sm font-medium">
                      {showIncorrectForm ? "Feedback submitted successfully." : "Thanks for your feedback!"}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* AI Confidence Status Card */}
                    <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${getConfidenceStyles(result.confidence).card}`}>
                      <h5 className="text-sm font-bold flex items-center gap-2">
                        {getConfidenceStyles(result.confidence).title}
                      </h5>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {getConfidenceStyles(result.confidence).message}
                      </p>
                    </div>

                    <h4 className="text-md font-medium text-white flex items-center gap-2">
                      Was this prediction correct?
                    </h4>
                    {!showIncorrectForm ? (
                      <div className="space-y-2">
                        <div className="flex gap-4">
                          <button
                            onClick={handleFeedbackYes}
                            disabled={loadingFeedback}
                            className="px-4 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 hover:border-primary-500/50 rounded-lg flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
                          >
                            👍 Yes
                          </button>
                          <button
                            onClick={() => setShowIncorrectForm(true)}
                            disabled={loadingFeedback}
                            className={getConfidenceStyles(result.confidence).noButton}
                          >
                            👎 No
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 italic font-medium">
                          {getConfidenceStyles(result.confidence).caption}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-surface-900/40 p-4 rounded-xl border border-white/5 animate-slide-up">
                        <div className="relative" ref={dropdownRef}>
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Select Correct Disease Class
                          </label>
                          <input
                            type="text"
                            placeholder="Search disease classes..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setSelectedCorrectDisease('');
                              setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            disabled={loadingFeedback}
                            className="input-field py-2 px-3 text-sm focus:ring-0 focus:border-white/20"
                          />
                          {isOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-surface-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                              {filteredClasses.length > 0 ? (
                                filteredClasses.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCorrectDisease(item);
                                      setSearchTerm(item);
                                      setIsOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface-800 hover:text-white transition-colors"
                                  >
                                    {item}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500 italic">No matching classes found</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleFeedbackNoSubmit}
                            disabled={loadingFeedback || !selectedCorrectDisease}
                            className="btn-primary py-2 px-4 text-sm font-semibold rounded-lg shadow-none"
                          >
                            {loadingFeedback ? "Submitting..." : "Submit Feedback"}
                          </button>
                          <button
                            onClick={() => {
                              setShowIncorrectForm(false);
                              setSelectedCorrectDisease('');
                              setSearchTerm('');
                            }}
                            disabled={loadingFeedback}
                            className="btn-secondary py-2 px-4 text-sm font-semibold rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <FiImage className="w-16 h-16 text-gray-500 mb-4" />
              <p className="text-gray-400">Upload and analyze an image to see results here.</p>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="mt-8">
        <h2 className="text-xl font-display font-semibold text-white mb-4">Previous Scans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {history.length > 0 ? history.map((item) => (
            <div key={item._id} className="glass-card overflow-hidden group">
              <div className="h-40 w-full overflow-hidden relative">
                <img
                  src={`http://localhost:5000${item.imageUrl}`}
                  alt={item.disease}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-semibold truncate" title={item.disease}>{item.disease}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-300">{new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getSeverityColor(item.severity)}`}>
                      {item.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-8 text-center glass-card">
              <p className="text-gray-400">No previous scans found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Assuming FiArrowRight was not imported above, let's fix the imports
// Oh I see I used FiArrowRight in the JSX but didn't import it in this file block. I will add it via replace_file_content if it errors, or I can just import it now.
export default DiseaseDetection;
