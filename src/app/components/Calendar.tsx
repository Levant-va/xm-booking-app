'use client';

import { useState, useEffect } from 'react';
import { format, addDays, isSameDay, isBefore, isAfter } from 'date-fns';

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedPosition: string;
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'controlling' | 'training' | 'exam';
}

export default function Calendar({ onDateSelect, selectedPosition }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = addDays(firstDay, -firstDay.getDay());
    const endDate = addDays(lastDay, 6 - lastDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Check if date has bookings
  const hasBookings = (date: Date) => {
    return bookings.some(booking => 
      isSameDay(new Date(booking.date), date)
    );
  };

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  // Check if date is too far in the future (e.g., more than 30 days)
  const isTooFarFuture = (date: Date) => {
    const maxDate = addDays(new Date(), 30);
    return isAfter(date, maxDate);
  };

  // Load bookings for the selected position
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual API call
        const response = await fetch(`/api/bookings?position=${selectedPosition}&month=${currentMonth.getMonth()}&year=${currentMonth.getFullYear()}`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data.bookings || []);
        }
      } catch (error) {
        console.error('Failed to load bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedPosition) {
      loadBookings();
    }
  }, [selectedPosition, currentMonth]);

  const handleDateClick = (date: Date) => {
    if (!isPastDate(date) && !isTooFarFuture(date)) {
      onDateSelect(date);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const days = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, new Date());
          const isPast = isPastDate(date);
          const isTooFar = isTooFarFuture(date);
          const hasBooking = hasBookings(date);
          const isClickable = !isPast && !isTooFar;

          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={!isClickable}
              className={`
                p-3 text-sm rounded-md transition-all duration-200 relative
                ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 font-bold' : ''}
                ${hasBooking ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600' : ''}
                ${isClickable ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'cursor-not-allowed opacity-50'}
                ${isPast ? 'bg-gray-50 dark:bg-gray-800' : ''}
                ${isTooFar ? 'bg-gray-50 dark:bg-gray-800' : ''}
              `}
            >
              {format(date, 'd')}
              {hasBooking && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Available</span>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}
    </div>
  );
}
