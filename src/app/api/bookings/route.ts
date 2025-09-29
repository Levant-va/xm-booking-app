import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Booking, Position, AuditLog } from '@/lib/models';

interface BookingQuery {
  position?: string;
  date?: {
    $gte: string;
    $lte: string;
  };
}

interface DiscordBooking {
  position: string;
  startTime: string;
  endTime: string;
  userId: string;
  type: string;
  date: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const query: BookingQuery = {};

    if (position) {
      query.position = position;
    }

    if (month && year) {
      const targetMonth = parseInt(month);
      const targetYear = parseInt(year);
      
      // Create date range for the month
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0);
      
      query.date = {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      };
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      bookings,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const bookingData = await request.json();

    // Validate required fields
    const requiredFields = ['userId', 'position', 'date', 'startTime', 'endTime', 'type'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if position exists and is active
    const position = await Position.findOne({ id: bookingData.position, isActive: true });
    if (!position) {
      return NextResponse.json(
        { error: 'Position not found or inactive' },
        { status: 404 }
      );
    }

    // Check for conflicts
    const conflict = await Booking.findOne({
      position: bookingData.position,
      date: bookingData.date,
      status: 'active',
      $or: [
        {
          $and: [
            { startTime: { $lte: bookingData.startTime } },
            { endTime: { $gt: bookingData.startTime } }
          ]
        },
        {
          $and: [
            { startTime: { $lt: bookingData.endTime } },
            { endTime: { $gte: bookingData.endTime } }
          ]
        },
        {
          $and: [
            { startTime: { $gte: bookingData.startTime } },
            { endTime: { $lte: bookingData.endTime } }
          ]
        }
      ]
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'Time slot is already booked by another user' },
        { status: 409 }
      );
    }

    // Create new booking
    const newBooking = new Booking({
      ...bookingData,
      status: 'active',
    });

    await newBooking.save();

    // Log audit trail
    const auditLog = new AuditLog({
      action: 'create',
      userId: bookingData.userId,
      bookingId: newBooking._id.toString(),
      details: `Created booking for ${bookingData.position} on ${bookingData.date} from ${bookingData.startTime} to ${bookingData.endTime}`,
    });

    await auditLog.save();

    // Send Discord webhook notification
    await sendDiscordNotification(newBooking);

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// Helper function to send Discord webhook notification
async function sendDiscordNotification(booking: DiscordBooking) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('Discord webhook URL not configured');
      return;
    }

    const embed = {
      title: 'New ATC Booking',
      color: 0x3498db, // Blue color
      fields: [
        {
          name: 'Position',
          value: booking.position,
          inline: true,
        },
        {
          name: 'Date',
          value: booking.date,
          inline: true,
        },
        {
          name: 'Time',
          value: `${booking.startTime} - ${booking.endTime}`,
          inline: true,
        },
        {
          name: 'Type',
          value: booking.type.charAt(0).toUpperCase() + booking.type.slice(1),
          inline: true,
        },
        {
          name: 'User',
          value: `VID: ${booking.userId}`,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'XM Booking System',
      },
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}