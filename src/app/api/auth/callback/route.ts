import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  // Dynamically determine redirect URI based on the request host
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const REDIRECT_URI = `${protocol}://${host}/api/auth/callback`;
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    const { tokens } = await oauth2Client.getToken(code);
    
    // Create redirect response
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('authenticated', 'true');
    const response = NextResponse.redirect(redirectUrl);

    // Set secure cookies
    response.cookies.set('accessToken', tokens.access_token || '', {
      httpOnly: false, // need false so client JS can read
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    if (tokens.refresh_token) {
      response.cookies.set('refreshToken', tokens.refresh_token, {
        httpOnly: false, // need false so client JS can read
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
  }
}
