'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleIVAOLogin = () => {
    setIsLoading(true);
    
    // Redirect to IVAO OAuth via server endpoint
    window.location.href = '/api/auth/ivao';
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleIVAOLogin}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Redirecting to IVAO...
          </>
        ) : (
          'Sign in with IVAO'
        )}
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sign in with your IVAO account to access the booking system
        </p>
      </div>
    </div>
  );
}
