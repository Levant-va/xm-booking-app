import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { UserStats, Booking } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get or create user stats
    let userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      userStats = new UserStats({
        userId,
        controllingHours: 0,
        bookingHours: 0,
        controllingPerMonth: 0,
      });
      await userStats.save();
    }

    // Calculate current month's controlling hours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyBookings = await Booking.find({
      userId,
      status: 'completed',
      updatedAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const monthlyHours = monthlyBookings.reduce((total, booking) => {
      const start = new Date(`2000-01-01 ${booking.startTime}`);
      const end = new Date(`2000-01-01 ${booking.endTime}`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    // Update monthly hours
    userStats.controllingPerMonth = monthlyHours;
    await userStats.save();

    return NextResponse.json({
      userStats,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, controllingHours, bookingHours } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update or create user stats
    const userStats = await UserStats.findOneAndUpdate(
      { userId },
      {
        userId,
        controllingHours: controllingHours || 0,
        bookingHours: bookingHours || 0,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      userStats,
      success: true,
    });

  } catch (error) {
    console.error('Error updating user stats:', error);
    return NextResponse.json(
      { error: 'Failed to update user statistics' },
      { status: 500 }
    );
  }
}
