import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  division: string;
  country: string;
}

export async function POST() {
  try {
    // Use the IVAO API key from environment variables
    const apiKey = process.env.IVAO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'IVAO API key not configured' },
        { status: 500 }
      );
    }

    // Validate API key and fetch user data from IVAO
    const userData = await fetchIVAOUserData(apiKey);
    
    if (!userData) {
      return NextResponse.json(
        { error: 'Invalid API key or failed to fetch user data' },
        { status: 401 }
      );
    }

    // Check if user is staff
    const isStaff = await checkStaffStatus(apiKey);

    // Get or create user statistics
    const userStats = await getUserStats(userData.vid);

    return NextResponse.json({
      user: {
        ...userData,
        controllingHours: userStats.controllingHours,
        bookingHours: userStats.bookingHours,
        controllingPerMonth: userStats.controllingPerMonth,
      },
      isStaff,
      success: true,
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper function to validate IVAO API key and fetch user data
async function fetchIVAOUserData(apiKey: string) {
  try {
    const response = await fetch('https://api.ivao.aero/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('IVAO API error:', response.status, response.statusText);
      return null;
    }

    const userData = await response.json();
    
    return {
      vid: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      rating: userData.rating,
      division: userData.division,
      country: userData.country,
      atcRating: userData.atcRating,
      pilotRating: userData.pilotRating,
    };
  } catch (error) {
    console.error('Error fetching IVAO user data:', error);
    return null;
  }
}

// Helper function to check if user is staff
async function checkStaffStatus(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.ivao.aero/v2/users/staff', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const staffData = await response.json();
    
    // Get current user's VID
    const userResponse = await fetch('https://api.ivao.aero/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!userResponse.ok) {
      return false;
    }

    const userData = await userResponse.json();
    
    // Check if current user is in staff list
    return staffData.some((staff: StaffMember) => staff.id === userData.id);
  } catch (error) {
    console.error('Error checking staff status:', error);
    return false;
  }
}

// Helper function to get user statistics
async function getUserStats(vid: string) {
  try {
    await connectDB();
    
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/user-stats?userId=${vid}`);
    if (response.ok) {
      const data = await response.json();
      return data.userStats || {
        controllingHours: 0,
        bookingHours: 0,
        controllingPerMonth: 0,
      };
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
  }
  
  return {
    controllingHours: 0,
    bookingHours: 0,
    controllingPerMonth: 0,
  };
}