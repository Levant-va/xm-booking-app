'use client';

import { useState } from 'react';
import { useApp } from '../providers';

export default function ProfileDropdown() {
  const { user, logout } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user.firstName.charAt(0)}
        </div>
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {user.firstName} {user.lastName}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user.firstName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    VID: {user.vid}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.atcRating} | {user.division}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Controlling Hours:</span>
                    <span className="font-medium">{user.controllingHours}</span>
                  </div>
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Booking Hours:</span>
                    <span className="font-medium">{user.bookingHours}</span>
                  </div>
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>This Month:</span>
                    <span className="font-medium">{user.controllingPerMonth}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
