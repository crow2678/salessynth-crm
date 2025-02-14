import React, { useState } from 'react';
import { Mail, Lock, Loader } from 'lucide-react';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-7xl flex shadow-2xl rounded-2xl overflow-hidden bg-white">
        {/* Left Panel */}
        <div className="w-3/5 bg-gradient-to-br from-green-600 via-green-700 to-indigo-800 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black opacity-10" />
            <div className="absolute -right-1/4 top-1/4 w-96 h-96 bg-indigo-500 rounded-full opacity-20 blur-3xl" />
            <div className="absolute -left-1/4 bottom-1/4 w-96 h-96 bg-green-500 rounded-full opacity-20 blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center p-16 text-white">
            <div className="mb-12">
              <div className="inline-flex items-center space-x-2 mb-8">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">SalesSynth</span>
              </div>
            
              <h1 className="text-6xl font-bold mb-4 leading-tight">
                RevBoost
                <br />
                Sales Platform
              </h1>
              <p className="text-xl text-green-100">
                for growing businesses
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              <div className="flex items-center space-x-6 bg-white/5 p-6 rounded-xl backdrop-blur-sm">
                <div className="w-14 h-14 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Client Management</h3>
                  <p className="text-green-100">Track all your client interactions</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 bg-white/5 p-6 rounded-xl backdrop-blur-sm">
                <div className="w-14 h-14 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Task Management</h3>
                  <p className="text-green-100">Stay organized and efficient</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 bg-white/5 p-6 rounded-xl backdrop-blur-sm">
                <div className="w-14 h-14 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Sales Analytics</h3>
                  <p className="text-green-100">Make data-driven decisions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-2/5 bg-white flex items-center justify-center p-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-3 text-lg text-gray-600">
                Access your SalesSynth dashboard
              </p>
            </div>

            <form onSubmit={handleDemoLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-lg"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-lg"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mt-8"
              >
                {isLoading ? (
                  <Loader className="h-6 w-6 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;