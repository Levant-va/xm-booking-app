import mongoose, { Schema, Document } from 'mongoose';

// Position Schema
export interface IPosition extends Document {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema = new Schema<IPosition>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Booking Schema
export interface IBooking extends Document {
  userId: string;
  position: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'controlling' | 'training' | 'exam';
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  userId: { type: String, required: true },
  position: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: { type: String, enum: ['controlling', 'training', 'exam'], required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, {
  timestamps: true,
});

// User Statistics Schema
export interface IUserStats extends Document {
  userId: string;
  controllingHours: number;
  bookingHours: number;
  controllingPerMonth: number;
  lastUpdated: Date;
}

const UserStatsSchema = new Schema<IUserStats>({
  userId: { type: String, required: true, unique: true },
  controllingHours: { type: Number, default: 0 },
  bookingHours: { type: Number, default: 0 },
  controllingPerMonth: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Audit Log Schema
export interface IAuditLog extends Document {
  action: 'create' | 'update' | 'delete' | 'system';
  userId: string;
  bookingId?: string;
  positionId?: string;
  details: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, enum: ['create', 'update', 'delete', 'system'], required: true },
  userId: { type: String, required: true },
  bookingId: { type: String },
  positionId: { type: String },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Create models
export const Position = mongoose.models.Position || mongoose.model<IPosition>('Position', PositionSchema);
export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export const UserStats = mongoose.models.UserStats || mongoose.model<IUserStats>('UserStats', UserStatsSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
