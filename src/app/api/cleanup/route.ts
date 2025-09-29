import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Booking, AuditLog } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();

    // Mark bookings as completed when they end
    const now = new Date();
    const completedBookings = await Booking.updateMany(
      {
        status: 'active',
        $expr: {
          $lte: [
            { $dateFromString: { dateString: { $concat: ['$date', 'T', '$endTime', ':00'] } } },
            now
          ]
        }
      },
      {
        $set: { 
          status: 'completed',
          updatedAt: new Date()
        }
      }
    );

    // Clear expired bookings (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const expiredBookings = await Booking.deleteMany({
      status: 'completed',
      updatedAt: { $lt: sevenDaysAgo }
    });

    // Log cleanup actions
    if (completedBookings.modifiedCount > 0 || expiredBookings.deletedCount > 0) {
      const auditLog = new AuditLog({
        action: 'system',
        userId: 'system',
        details: `System cleanup: marked ${completedBookings.modifiedCount} bookings as completed, deleted ${expiredBookings.deletedCount} expired bookings`,
      });
      await auditLog.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup tasks completed successfully',
      completed: completedBookings.modifiedCount,
      deleted: expiredBookings.deletedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error running cleanup tasks:', error);
    return NextResponse.json(
      { error: 'Failed to run cleanup tasks' },
      { status: 500 }
    );
  }
}

// This endpoint can be called by a cron job or scheduled task
// to automatically clean up expired bookings
export async function POST() {
  try {
    await connectDB();

    // Mark bookings as completed when they end
    const now = new Date();
    const completedBookings = await Booking.updateMany(
      {
        status: 'active',
        $expr: {
          $lte: [
            { $dateFromString: { dateString: { $concat: ['$date', 'T', '$endTime', ':00'] } } },
            now
          ]
        }
      },
      {
        $set: { 
          status: 'completed',
          updatedAt: new Date()
        }
      }
    );

    // Clear expired bookings (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const expiredBookings = await Booking.deleteMany({
      status: 'completed',
      updatedAt: { $lt: sevenDaysAgo }
    });

    // Log cleanup actions
    if (completedBookings.modifiedCount > 0 || expiredBookings.deletedCount > 0) {
      const auditLog = new AuditLog({
        action: 'system',
        userId: 'system',
        details: `System cleanup: marked ${completedBookings.modifiedCount} bookings as completed, deleted ${expiredBookings.deletedCount} expired bookings`,
      });
      await auditLog.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup tasks completed successfully',
      completed: completedBookings.modifiedCount,
      deleted: expiredBookings.deletedCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error running cleanup tasks:', error);
    return NextResponse.json(
      { error: 'Failed to run cleanup tasks' },
      { status: 500 }
    );
  }
}