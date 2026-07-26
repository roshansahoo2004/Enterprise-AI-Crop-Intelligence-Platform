import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Track consecutive wrong-password attempts
  const failedAttempts = useRef(0);

  const handleChange = (e) => {
    // Reset attempt counter when email changes so a fresh email gets a fresh count
    if (e.target.name === 'email') {
      failedAttempts.current = 0;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      failedAttempts.current = 0;
      toast.success('Welcome back to AgriSense!');
      navigate('/');
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        // Account does not exist — redirect to signup with router state
        toast.error('Account not found. Please sign up first.');
        setTimeout(() => navigate('/signup', { state: { fromLogin: true } }), 2000);
      } else if (status === 401) {
        // Wrong password — escalate message based on attempt count
        failedAttempts.current += 1;
        const attempt = failedAttempts.current;

        if (attempt === 1) {
          toast.error('Incorrect password. Please try again.');
        } else if (attempt === 2) {
          toast.error('Still incorrect. Please check your password carefully.');
        } else {
          // 3rd+ attempt — show toast with clickable forgot-password link
          toast.error(
            (t) => (
              <div>
                <p className="font-medium">Incorrect password.</p>
                <button
                  onClick={() => { toast.dismiss(t.id); navigate('/forgot-password'); }}
                  className="mt-1 text-sm text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            ),
            { duration: 5000 }
          );
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[100px] -z-10"></div>

      <div className="glass-card w-full max-w-md p-8 md:p-10 animate-scale-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-secondary-400"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome to <span className="text-primary-400">Agri</span>Sense
          </h1>
          <p className="text-gray-400 text-sm">Sign in to continue to your intelligent crop planner</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-300 ml-1 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMail className="text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field pl-11"
                placeholder="farmer@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300">Forgot Password?</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="text-gray-500" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field pl-11"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-8 flex justify-center items-center gap-2"
          >
            {loading ? 'Signing in...' : (
              <>Sign In <FiArrowRight /></>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
