import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Booking, AuditLog } from '@/lib/models';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    const oldBooking = await Booking.findById(id);
    
    if (!oldBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    // Log audit trail
    const auditLog = new AuditLog({
      action: 'update',
      userId: oldBooking.userId,
      bookingId: id,
      details: `Updated booking: ${JSON.stringify(updates)}`,
    });

    await auditLog.save();

    return NextResponse.json(updatedBooking);

  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const deletedBooking = await Booking.findByIdAndDelete(id);
    
    if (!deletedBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Log audit trail
    const auditLog = new AuditLog({
      action: 'delete',
      userId: deletedBooking.userId,
      bookingId: id,
      details: `Deleted booking for ${deletedBooking.position} on ${deletedBooking.date}`,
    });

    await auditLog.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}