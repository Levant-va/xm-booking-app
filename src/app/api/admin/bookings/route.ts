import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Booking } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();

    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      bookings,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}