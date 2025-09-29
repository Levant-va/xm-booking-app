import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

interface Booking {
  id: string;
  userId: string;
  position: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  bookingId?: string;
  details: string;
  timestamp: string;
}

// File-based storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

// Read bookings from file
async function readBookings(): Promise<Booking[]> {
  try {
    await ensureDataDir();
    if (!existsSync(BOOKINGS_FILE)) {
      return [];
    }
    const data = await readFile(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bookings:', error);
    return [];
  }
}

// Write bookings to file
async function writeBookings(bookings: Booking[]): Promise<void> {
  try {
    await ensureDataDir();
    await writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error writing bookings:', error);
    throw error;
  }
}

// Read audit logs from file
async function readAuditLogs(): Promise<AuditLog[]> {
  try {
    await ensureDataDir();
    if (!existsSync(AUDIT_FILE)) {
      return [];
    }
    const data = await readFile(AUDIT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading audit logs:', error);
    return [];
  }
}

// Write audit log to file
async function writeAuditLog(log: AuditLog): Promise<void> {
  try {
    await ensureDataDir();
    const logs = await readAuditLogs();
    logs.push(log);
    await writeFile(AUDIT_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error writing audit log:', error);
    throw error;
  }
}

// Function to clear expired bookings
export async function clearExpiredBookings(): Promise<void> {
  try {
    const bookings = await readBookings();
    const now = new Date();
    let clearedCount = 0;

    const activeBookings = bookings.filter(booking => {
      if (booking.status !== 'active') {
        return true; // Keep non-active bookings
      }

      // Check if booking has expired
      const bookingDateTime = new Date(`${booking.date} ${booking.endTime}`);
      
      if (bookingDateTime <= now) {
        clearedCount++;
        return false; // Remove expired booking
      }

      return true; // Keep active booking
    });

    if (clearedCount > 0) {
      await writeBookings(activeBookings);

      // Log the cleanup action
      await writeAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        action: 'system',
        userId: 'system',
        bookingId: 'multiple',
        details: `System automatically cleared ${clearedCount} expired booking(s)`,
        timestamp: new Date().toISOString(),
      });

      console.log(`Cleared ${clearedCount} expired bookings`);
    }
  } catch (error) {
    console.error('Error clearing expired bookings:', error);
  }
}

// Function to mark bookings as completed when they end
export async function markCompletedBookings(): Promise<void> {
  try {
    const bookings = await readBookings();
    const now = new Date();
    let updatedCount = 0;

    const updatedBookings = bookings.map(booking => {
      if (booking.status !== 'active') {
        return booking; // Don't modify non-active bookings
      }

      // Check if booking should be marked as completed
      const bookingEndDateTime = new Date(`${booking.date} ${booking.endTime}`);
      
      if (bookingEndDateTime <= now) {
        updatedCount++;
        return {
          ...booking,
          status: 'completed',
          updatedAt: new Date().toISOString(),
        };
      }

      return booking;
    });

    if (updatedCount > 0) {
      await writeBookings(updatedBookings);

      // Log the completion action
      await writeAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        action: 'system',
        userId: 'system',
        bookingId: 'multiple',
        details: `System automatically marked ${updatedCount} booking(s) as completed`,
        timestamp: new Date().toISOString(),
      });

      console.log(`Marked ${updatedCount} bookings as completed`);
    }
  } catch (error) {
    console.error('Error marking completed bookings:', error);
  }
}
