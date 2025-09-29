'use client';

import { useState } from 'react';
import { useApp } from '../providers';
import PositionSelector from './PositionSelector';
import Calendar from './Calendar';
import TimeSelectionModal from './TimeSelectionModal';
import AdminPanel from './AdminPanel';

export default function BookingInterface() {
  const { user, isStaff } = useApp();
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowTimeModal(true);
  };

  const handleBookingComplete = () => {
    setSelectedDate(null);
    setShowTimeModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          VID: {user?.vid} | Rating: {user?.atcRating} | Division: {user?.division}
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">Controlling Hours</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user?.controllingHours || 0}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200">Booking Hours</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{user?.bookingHours || 0}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">This Month</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user?.controllingPerMonth || 0}</p>
          </div>
        </div>
      </div>

      {/* Position Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Position
        </h3>
        <PositionSelector
          selectedPosition={selectedPosition}
          onPositionSelect={setSelectedPosition}
        />
      </div>

      {/* Calendar */}
      {selectedPosition && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Date for {selectedPosition}
          </h3>
          <Calendar
            onDateSelect={handleDateSelect}
            selectedPosition={selectedPosition}
          />
        </div>
      )}

      {/* Time Selection Modal */}
      {showTimeModal && selectedDate && (
        <TimeSelectionModal
          isOpen={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          selectedDate={selectedDate}
          selectedPosition={selectedPosition}
          onBookingComplete={handleBookingComplete}
        />
      )}

      {/* Admin Panel */}
      {isStaff && (
        <div className="mt-8">
          <AdminPanel />
        </div>
      )}
    </div>
  );
}
