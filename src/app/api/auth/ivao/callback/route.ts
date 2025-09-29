import { NextRequest, NextResponse } from 'next/server';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  division: string;
  country: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const redirectUrl = new URL('/auth/error', request.url);
      redirectUrl.searchParams.set('error', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Authorization code and state are required' },
        { status: 400 }
      );
    }

    // Verify state parameter
    const storedState = request.cookies.get('ivao-oauth-state')?.value;
    if (!storedState || storedState !== state) {
      console.error('Invalid state parameter');
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://login.ivao.aero/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.IVAO_CLIENT_ID!,
        client_secret: process.env.IVAO_CLIENT_SECRET!,
        code: code,
        redirect_uri: process.env.IVAO_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/ivao/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user data from IVAO
    const userResponse = await fetch('https://login.ivao.aero/api/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();

    // Check if user is staff
    const staffResponse = await fetch('https://login.ivao.aero/api/users/staff', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let isStaff = false;
    if (staffResponse.ok) {
      const staffData = await staffResponse.json();
      isStaff = staffData.some((staff: StaffMember) => staff.id === userData.id);
    }

    // Create session data
    const sessionData = {
      user: {
        id: userData.id,
        vid: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email || `${userData.id}@ivao.aero`,
        rating: userData.rating,
        division: userData.division,
        country: userData.country,
        atcRating: userData.atcRating,
        pilotRating: userData.pilotRating,
        avatar: userData.avatar,
        controllingHours: 0,
        bookingHours: 0,
        controllingPerMonth: 0,
      },
      isStaff,
      accessToken,
    };

    // Redirect to frontend with session data
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth', 'success');
    redirectUrl.searchParams.set('session', encodeURIComponent(JSON.stringify(sessionData)));

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('IVAO OAuth callback error:', error);
    
    const redirectUrl = new URL('/auth/error', request.url);
    redirectUrl.searchParams.set('error', 'Verification');
    
    return NextResponse.redirect(redirectUrl);
  }
}
