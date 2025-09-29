import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Position, AuditLog } from '@/lib/models';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const updates = await request.json();

    const oldPosition = await Position.findById(id);
    
    if (!oldPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Update position
    const updatedPosition = await Position.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    // Log audit trail
    const auditLog = new AuditLog({
      action: 'update',
      userId: 'admin',
      positionId: id,
      details: `Updated position: ${JSON.stringify(updates)}`,
    });

    await auditLog.save();

    return NextResponse.json(updatedPosition);

  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
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

    const deletedPosition = await Position.findByIdAndDelete(id);
    
    if (!deletedPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Log audit trail
    const auditLog = new AuditLog({
      action: 'delete',
      userId: 'admin',
      positionId: id,
      details: `Deleted position: ${deletedPosition.name} (${deletedPosition.id})`,
    });

    await auditLog.save();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}
