import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return toast.error('Please enter a valid email address.');
    }

    setLoading(true);

    try {
      // TODO: Connect to backend API when ready
      // await authAPI.forgotPassword({ email });

      // Simulate a short network delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('If an account exists with this email, a password reset link will be sent.');
      setSubmitted(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-secondary-500/10 rounded-full blur-[100px] -z-10"></div>

      <div className="glass-card w-full max-w-md p-8 md:p-10 animate-scale-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-secondary-400"></div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Reset <span className="text-primary-400">Password</span>
          </h1>
          <p className="text-gray-400 text-sm">
            {submitted
              ? 'Check your email for further instructions.'
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-300 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-11"
                  placeholder="farmer@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-8 flex justify-center items-center gap-2"
            >
              {loading ? 'Sending...' : (
                <>Send Reset Link <FiSend /></>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 border border-primary-500/20">
              <FiMail className="h-7 w-7 text-primary-400" />
            </div>
            <p className="text-sm text-gray-300">
              If <span className="font-medium text-white">{email}</span> is registered, you'll receive a password reset link shortly.
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-gray-400">
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors inline-flex items-center gap-1">
            <FiArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
