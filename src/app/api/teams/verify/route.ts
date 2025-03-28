import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const teamName = url.searchParams.get('teamName');

    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Check if team exists
    const user = await User.findOne({ teamName });
    
    if (!user) {
      return NextResponse.json({
        valid: false,
        message: 'Team not found'
      });
    }

    return NextResponse.json({
      valid: true,
      blocked: user.isBlocked,
      reason: user.blockReason || ''
    });
  } catch (error) {
    console.error('Error verifying team:', error);
    return NextResponse.json(
      { error: 'Failed to verify team' },
      { status: 500 }
    );
  }
} 