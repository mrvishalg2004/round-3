import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import Winner from '@/models/Winner';

export async function GET() {
  try {
    await dbConnect();
    
    // Get winners sorted by position (1st, 2nd, 3rd, etc.)
    const winners = await Winner.find({})
      .sort({ position: 1 })
      .select('teamName position createdAt');
    
    return NextResponse.json({ winners, success: true });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
} 