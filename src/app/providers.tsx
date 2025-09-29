'use client';

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Types
export interface User {
  vid: string;
  firstName: string;
  lastName: string;
  rating: string;
  division: string;
  country: string;
  atcRating: string;
  pilotRating: string;
  controllingHours: number;
  bookingHours: number;
  controllingPerMonth: number;
}

export interface Booking {
  id: string;
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

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Context types
interface AppContextType {
  user: User | null;
  bookings: Booking[];
  notifications: Notification[];
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  isAuthenticated: boolean;
  isStaff: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<boolean>;
  deleteBooking: (id: string) => Promise<boolean>;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProvidersWithSearchParams>{children}</ProvidersWithSearchParams>
    </Suspense>
  );
}

function ProvidersWithSearchParams({ children }: ProvidersProps) {
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const auth = searchParams.get('auth');
    const sessionData = searchParams.get('session');

    if (auth === 'success' && sessionData) {
      try {
        const session = JSON.parse(decodeURIComponent(sessionData));
        const userData: User = {
          vid: session.user.vid,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          rating: session.user.rating,
          division: session.user.division,
          country: session.user.country,
          atcRating: session.user.atcRating,
          pilotRating: session.user.pilotRating,
          controllingHours: 0, // Will be fetched from API
          bookingHours: 0, // Will be fetched from API
          controllingPerMonth: 0, // Will be fetched from API
        };

        setUser(userData);
        setIsAuthenticated(true);
        
        // Store session in localStorage
        localStorage.setItem('xm-session', JSON.stringify(session));
        
        // Check if user is staff
        checkStaffStatus(session.user.vid);
        
        // Load user statistics
        loadUserStats(session.user.vid);

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        console.error('Failed to parse session data');
      }
    }
  }, [searchParams]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('xm-session');
    const savedLanguage = localStorage.getItem('xm-language') as 'en' | 'ar' | null;
    const savedTheme = localStorage.getItem('xm-theme') as 'light' | 'dark' | null;
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const userData: User = {
          vid: session.user.vid,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          rating: session.user.rating,
          division: session.user.division,
          country: session.user.country,
          atcRating: session.user.atcRating,
          pilotRating: session.user.pilotRating,
          controllingHours: 0,
          bookingHours: 0,
          controllingPerMonth: 0,
        };

        setUser(userData);
        setIsAuthenticated(true);
        
        // Check if user is staff
        checkStaffStatus(session.user.vid);
        
        // Load user statistics
        loadUserStats(session.user.vid);
      } catch {
        console.error('Failed to load session');
        localStorage.removeItem('xm-session');
      }
    }
    
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('xm-language', language);
  }, [language]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('xm-theme', theme);
  }, [theme]);

  const checkStaffStatus = async (vid: string) => {
    try {
      const response = await fetch('/api/auth/staff-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vid }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsStaff(data.isStaff);
      }
    } catch {
      console.error('Failed to check staff status');
    }
  };

  const loadUserStats = async (vid: string) => {
    try {
      const response = await fetch(`/api/user-stats?userId=${vid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.userStats) {
          setUser(prev => prev ? {
            ...prev,
            controllingHours: data.userStats.controllingHours,
            bookingHours: data.userStats.bookingHours,
            controllingPerMonth: data.userStats.controllingPerMonth,
          } : null);
        }
      }
    } catch {
      console.error('Failed to load user stats');
    }
  };

  const login = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/ivao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const user: User = {
          vid: userData.user.vid,
          firstName: userData.user.firstName,
          lastName: userData.user.lastName,
          rating: userData.user.rating,
          division: userData.user.division,
          country: userData.user.country,
          atcRating: userData.user.atcRating,
          pilotRating: userData.user.pilotRating,
          controllingHours: userData.user.controllingHours || 0,
          bookingHours: userData.user.bookingHours || 0,
          controllingPerMonth: userData.user.controllingPerMonth || 0,
        };

        setUser(user);
        setIsAuthenticated(true);
        setIsStaff(userData.isStaff);
        
        // Store session in localStorage
        localStorage.setItem('xm-session', JSON.stringify(userData));
        
        addNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${user.firstName}!`,
        });
        
        return true;
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Login Failed',
          message: error.error || 'Invalid API key or authentication failed',
        });
        return false;
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Login Error',
        message: 'An error occurred during login',
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsStaff(false);
    setBookings([]);
    localStorage.removeItem('xm-session');
    addNotification({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been successfully logged out',
    });
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const newBooking = await response.json();
        setBookings(prev => [...prev, newBooking]);
        addNotification({
          type: 'success',
          title: 'Booking Created',
          message: `Successfully booked ${bookingData.position} for ${bookingData.date}`,
        });
        return true;
      } else {
        const error = await response.json();
        addNotification({
          type: 'error',
          title: 'Booking Failed',
          message: error.message || 'Failed to create booking',
        });
        return false;
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Booking Error',
        message: 'An error occurred while creating the booking',
      });
      return false;
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedBooking = await response.json();
        setBookings(prev => prev.map(booking => 
          booking.id === id ? updatedBooking : booking
        ));
        addNotification({
          type: 'success',
          title: 'Booking Updated',
          message: 'Booking has been successfully updated',
        });
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update booking',
        });
        return false;
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Update Error',
        message: 'An error occurred while updating the booking',
      });
      return false;
    }
  };

  const deleteBooking = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBookings(prev => prev.filter(booking => booking.id !== id));
        addNotification({
          type: 'success',
          title: 'Booking Deleted',
          message: 'Booking has been successfully deleted',
        });
        return true;
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete booking',
        });
        return false;
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Delete Error',
        message: 'An error occurred while deleting the booking',
      });
      return false;
    }
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const value: AppContextType = {
    user,
    bookings,
    notifications,
    language,
    theme,
    isAuthenticated,
    isStaff,
    login,
    logout,
    addBooking,
    updateBooking,
    deleteBooking,
    addNotification,
    removeNotification,
    setLanguage,
    setTheme,
  };

  return (
    <AppContext.Provider value={value}>
      <div className={`${theme} min-h-screen bg-background text-foreground`}>
        {children}
      </div>
    </AppContext.Provider>
  );
}