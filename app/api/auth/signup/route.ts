import { NextRequest, NextResponse } from 'next/server';
import { authDB } from '@/lib/db';
import { rateLimiter, rateLimitConfigs } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = rateLimiter.checkLimit(`signup:${ip}`, rateLimitConfigs.auth);
    
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${resetIn} minutes.` },
        { status: 429, headers: { 'Retry-After': resetIn.toString() } }
      );
    }

    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await authDB.signUp(email, password, fullName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: result.user,
      token: result.token
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
