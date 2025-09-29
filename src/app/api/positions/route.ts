import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Position, AuditLog } from '@/lib/models';

interface PositionQuery {
  isActive?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query: PositionQuery = {};
    if (activeOnly) {
      query.isActive = true;
    }

    const positions = await Position.find(query).sort({ name: 1 });

    return NextResponse.json({
      positions,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const positionData = await request.json();

    // Validate required fields
    const requiredFields = ['id', 'name', 'description'];
    for (const field of requiredFields) {
      if (!positionData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if position ID already exists
    const existingPosition = await Position.findOne({ id: positionData.id });
    if (existingPosition) {
      return NextResponse.json(
        { error: 'Position ID already exists' },
        { status: 409 }
      );
    }

    // Create new position
    const newPosition = new Position({
      id: positionData.id,
      name: positionData.name,
      description: positionData.description,
      isActive: positionData.isActive !== undefined ? positionData.isActive : true,
    });

    await newPosition.save();

    // Log audit trail
    const auditLog = new AuditLog({
      action: 'create',
      userId: 'admin',
      positionId: newPosition._id.toString(),
      details: `Created position: ${positionData.name} (${positionData.id})`,
    });

    await auditLog.save();

    return NextResponse.json(newPosition, { status: 201 });

  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}
