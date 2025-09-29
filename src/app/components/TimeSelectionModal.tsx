'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useApp } from '../providers';

interface TimeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  selectedPosition: string;
  onBookingComplete: () => void;
}

export default function TimeSelectionModal({
  isOpen,
  onClose,
  selectedDate,
  selectedPosition,
  onBookingComplete
}: TimeSelectionModalProps) {
  const { addBooking, addNotification } = useApp();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingType, setBookingType] = useState<'controlling' | 'training' | 'exam'>('controlling');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate time slots (every hour from 00:00 to 23:00)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    // Auto-set end time to 1 hour later
    const [hours] = time.split(':').map(Number);
    const endHour = (hours + 1) % 24;
    setEndTime(`${endHour.toString().padStart(2, '0')}:00`);
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
  };

  const validateBooking = () => {
    if (!startTime || !endTime) {
      addNotification({
        type: 'error',
        title: 'Invalid Time',
        message: 'Please select both start and end times',
      });
      return false;
    }

    const start = new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${startTime}`);
    const end = new Date(`${format(selectedDate, 'yyyy-MM-dd')} ${endTime}`);

    if (end <= start) {
      addNotification({
        type: 'error',
        title: 'Invalid Duration',
        message: 'End time must be after start time',
      });
      return false;
    }

    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours < 1) {
      addNotification({
        type: 'error',
        title: 'Minimum Duration',
        message: 'Booking must be at least 1 hour long',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBooking()) return;

    setIsSubmitting(true);

    try {
      const success = await addBooking({
        userId: '', // Will be set by the API based on authenticated user
        position: selectedPosition,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        type: bookingType,
        status: 'active',
      });

      if (success) {
        onBookingComplete();
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: 'An error occurred while creating the booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Book {selectedPosition}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Date Display */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Booking Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Booking Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'controlling', label: 'Controlling', color: 'blue' },
                  { value: 'training', label: 'Training', color: 'green' },
                  { value: 'exam', label: 'Exam', color: 'purple' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setBookingType(type.value as 'controlling' | 'training' | 'exam')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bookingType === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50 dark:bg-${type.color}-900/20 text-${type.color}-700 dark:text-${type.color}-300`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select start time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <select
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select end time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Display */}
            {startTime && endTime && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {(() => {
                    const start = new Date(`2000-01-01 ${startTime}`);
                    const end = new Date(`2000-01-01 ${endTime}`);
                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return `${duration} hour${duration !== 1 ? 's' : ''}`;
                  })()}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !startTime || !endTime}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
