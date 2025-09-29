'use client';

import { useState, useEffect } from 'react';

interface Position {
  _id: string;
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface PositionSelectorProps {
  selectedPosition: string;
  onPositionSelect: (position: string) => void;
}

export default function PositionSelector({ selectedPosition, onPositionSelect }: PositionSelectorProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('/api/positions?active=true');
        if (response.ok) {
          const data = await response.json();
          setPositions(data.positions || []);
        }
      } catch (error) {
        console.error('Failed to fetch positions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading positions...</span>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 mb-4">No positions available</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Contact an administrator to add controller positions
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {positions.map((position) => (
        <button
          key={position.id}
          onClick={() => onPositionSelect(position.id)}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            selectedPosition === position.id
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300'
          }`}
        >
          <div className="text-left">
            <h4 className="font-semibold text-lg">{position.name}</h4>
            <p className="text-sm opacity-75">{position.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
