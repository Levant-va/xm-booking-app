import { NextRequest, NextResponse } from 'next/server';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  division: string;
  country: string;
}

export async function POST(request: NextRequest) {
  try {
    const { vid } = await request.json();

    if (!vid) {
      return NextResponse.json(
        { error: 'VID is required' },
        { status: 400 }
      );
    }

    // Check if user is staff using IVAO API
    const isStaff = await checkIVAOStaffStatus(vid);

    return NextResponse.json({
      isStaff,
      success: true,
    });

  } catch (error) {
    console.error('Error checking staff status:', error);
    return NextResponse.json(
      { error: 'Failed to check staff status' },
      { status: 500 }
    );
  }
}

// Helper function to check IVAO staff status
async function checkIVAOStaffStatus(vid: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.ivao.aero/v2/users/staff', {
      headers: {
        'Authorization': `Bearer ${process.env.IVAO_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch IVAO staff list:', response.status);
      return false;
    }

    const staffData = await response.json();
    
    // Check if the user VID is in the staff list
    return staffData.some((staff: StaffMember) => staff.id === vid);
  } catch (error) {
    console.error('Error checking IVAO staff status:', error);
    return false;
  }
}
