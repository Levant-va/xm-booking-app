'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../providers';

interface Booking {
  _id: string;
  userId: string;
  position: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'controlling' | 'training' | 'exam';
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface Position {
  _id: string;
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  _id: string;
  action: 'create' | 'update' | 'delete' | 'system';
  userId: string;
  bookingId?: string;
  positionId?: string;
  details: string;
  timestamp: string;
}

export default function AdminPanel() {
  const { isStaff, addNotification } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'positions' | 'audit'>('bookings');
  const [showPositionModal, setShowPositionModal] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all bookings
      const bookingsResponse = await fetch('/api/admin/bookings');
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }

      // Load all positions
      const positionsResponse = await fetch('/api/positions');
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        setPositions(positionsData.positions || []);
      }

      // Load audit logs
      const auditResponse = await fetch('/api/admin/audit');
      if (auditResponse.ok) {
        const auditData = await auditResponse.json();
        setAuditLogs(auditData.logs || []);
      }
    } catch {
      console.error('Failed to load admin data');
      addNotification({
        type: 'error',
        title: 'Admin Data Error',
        message: 'Failed to load admin panel data',
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (isStaff) {
      loadAdminData();
    }
  }, [isStaff, loadAdminData]);

  const handleUpdateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? updatedBooking : booking
        ));
        addNotification({
          type: 'success',
          title: 'Booking Updated',
          message: 'Booking has been successfully updated',
        });
        loadAdminData(); // Reload to get updated audit logs
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update booking',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while updating the booking',
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(prev => prev.filter(booking => booking._id !== bookingId));
        addNotification({
          type: 'success',
          title: 'Booking Deleted',
          message: 'Booking has been successfully deleted',
        });
        loadAdminData(); // Reload to get updated audit logs
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete booking',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Delete Error',
        message: 'An error occurred while deleting the booking',
      });
    }
  };

  const handleCreatePosition = async (positionData: Omit<Position, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionData),
      });

      if (response.ok) {
        const newPosition = await response.json();
        setPositions(prev => [...prev, newPosition]);
        addNotification({
          type: 'success',
          title: 'Position Created',
          message: `Position ${newPosition.name} has been successfully created`,
        });
        setShowPositionModal(false);
        loadAdminData(); // Reload to get updated audit logs
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Creation Failed',
          message: error.error || 'Failed to create position',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Creation Error',
        message: 'An error occurred while creating the position',
      });
    }
  };

  const handleUpdatePosition = async (positionId: string, updates: Partial<Position>) => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedPosition = await response.json();
        setPositions(prev => prev.map(position => 
          position._id === positionId ? updatedPosition : position
        ));
        addNotification({
          type: 'success',
          title: 'Position Updated',
          message: 'Position has been successfully updated',
        });
        loadAdminData(); // Reload to get updated audit logs
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update position',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while updating the position',
      });
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('Are you sure you want to delete this position? This will also delete all associated bookings.')) {
      return;
    }

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPositions(prev => prev.filter(position => position._id !== positionId));
        addNotification({
          type: 'success',
          title: 'Position Deleted',
          message: 'Position has been successfully deleted',
        });
        loadAdminData(); // Reload to get updated audit logs
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete position',
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Delete Error',
        message: 'An error occurred while deleting the position',
      });
    }
  };

  if (!isStaff) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Access Denied
        </h3>
        <p className="text-red-700 dark:text-red-300">
          You do not have staff privileges to access the admin panel.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading admin data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Admin Panel Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-comic-relief">
              Admin Panel
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage bookings, positions, and view audit logs
            </p>
          </div>
          <button
            onClick={() => setShowPositionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Add Position
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'positions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'bookings' && (
          <BookingsTable
            bookings={bookings}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsTable
            positions={positions}
            onUpdatePosition={handleUpdatePosition}
            onDeletePosition={handleDeletePosition}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogTable auditLogs={auditLogs} />
        )}
      </div>

      {/* Position Creation Modal */}
      {showPositionModal && (
        <PositionModal
          isOpen={showPositionModal}
          onClose={() => setShowPositionModal(false)}
          onSubmit={handleCreatePosition}
        />
      )}
    </div>
  );
}

// Bookings Table Component
function BookingsTable({
  bookings,
  onUpdateBooking,
  onDeleteBooking,
}: {
  bookings: Booking[];
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
}) {
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking._id);
    setEditForm({
      position: booking.position,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      type: booking.type,
      status: booking.status,
    });
  };

  const handleSave = () => {
    if (editingBooking) {
      onUpdateBooking(editingBooking, editForm);
      setEditingBooking(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingBooking(null);
    setEditForm({});
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Position
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              User ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {editingBooking === booking._id ? (
                  <input
                    type="text"
                    value={editForm.position || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                ) : (
                  booking.position
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {editingBooking === booking._id ? (
                  <div className="space-y-1">
                    <input
                      type="date"
                      value={editForm.date || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    />
                    <div className="flex space-x-1">
                      <input
                        type="time"
                        value={editForm.startTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                      <span className="text-xs">-</span>
                      <input
                        type="time"
                        value={editForm.endTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div>{booking.date}</div>
                    <div className="text-xs">{booking.startTime} - {booking.endTime}</div>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {editingBooking === booking._id ? (
                  <select
                    value={editForm.type || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as 'controlling' | 'training' | 'exam' }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  >
                    <option value="controlling">Controlling</option>
                    <option value="training">Training</option>
                    <option value="exam">Exam</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.type === 'controlling' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                    booking.type === 'training' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                  }`}>
                    {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {editingBooking === booking._id ? (
                  <select
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as 'active' | 'completed' | 'cancelled' }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {booking.userId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {editingBooking === booking._id ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(booking)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteBooking(booking._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Positions Table Component
function PositionsTable({
  positions,
  onUpdatePosition,
  onDeletePosition,
}: {
  positions: Position[];
  onUpdatePosition: (id: string, updates: Partial<Position>) => void;
  onDeletePosition: (id: string) => void;
}) {
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Position>>({});

  const handleEdit = (position: Position) => {
    setEditingPosition(position._id);
    setEditForm({
      id: position.id,
      name: position.name,
      description: position.description,
      isActive: position.isActive,
    });
  };

  const handleSave = () => {
    if (editingPosition) {
      onUpdatePosition(editingPosition, editForm);
      setEditingPosition(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingPosition(null);
    setEditForm({});
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {positions.map((position) => (
            <tr key={position._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {editingPosition === position._id ? (
                  <input
                    type="text"
                    value={editForm.id || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                ) : (
                  position.id
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {editingPosition === position._id ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                ) : (
                  position.name
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {editingPosition === position._id ? (
                  <input
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  />
                ) : (
                  position.description
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {editingPosition === position._id ? (
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    position.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {position.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {editingPosition === position._id ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(position)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeletePosition(position._id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Position Creation Modal Component
function PositionModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Position, '_id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ id: '', name: '', description: '', isActive: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add New Position
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="e.g., XMMM_APP"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., XMMM_APP"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Approach Control"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Create Position
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Audit Log Table Component
function AuditLogTable({ auditLogs }: { auditLogs: AuditLog[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              User ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Booking ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Timestamp
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {auditLogs.map((log) => (
            <tr key={log._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  log.action === 'create' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                  log.action === 'update' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                  log.action === 'delete' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                }`}>
                  {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {log.userId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {log.bookingId || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {log.details}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}