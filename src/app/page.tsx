'use client';

import { useState, useEffect } from 'react';
import { useApp } from './providers';
import LoginForm from './components/LoginForm';
import BookingInterface from './components/BookingInterface';
import ProfileDropdown from './components/ProfileDropdown';
import NotificationContainer from './components/NotificationContainer';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  const { isAuthenticated } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      setIsLoading(false);
    };

    // Small delay to ensure providers are loaded
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 font-comic-relief">
              XM Booking System
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              ATC Position Booking Platform
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in with your IVAO API key to access the booking system
            </p>
          </div>
        </div>
        
        <NotificationContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white font-comic-relief">
                XM Booking System
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BookingInterface />
      </main>

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
}