import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';

export async function GET() {
  try {
    console.log('Admin teams API called');
    await dbConnect();
    console.log('Connected to database');
    
    // Get all teams including admin
    const allTeams = await User.find({});
    console.log(`Found ${allTeams.length} teams in database:`, 
      allTeams.map(t => ({ id: t._id, name: t.teamName, isAdmin: t.isAdmin })));
    
    return NextResponse.json({ 
      teams: allTeams, 
      success: true,
      count: allTeams.length
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams', details: error.message },
      { status: 500 }
    );
  }
} 