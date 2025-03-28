import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Problem from '@/models/Problem';

// Helper function to get a random item from an array
function getRandomItem(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { teamName, email } = body;
    
    // Validate required fields
    if (!teamName || !email) {
      return NextResponse.json(
        { error: 'Team name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if team already exists
    const existingTeam = await User.findOne({ teamName });
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team name already taken' },
        { status: 400 }
      );
    }
    
    // Create new user with team info - only use fields defined in User model
    const user = await User.create({
      teamName,
      email,
      isAdmin: false,
      isBlocked: false
    });
    
    console.log('Team registered successfully:', { teamName, email });
    
    return NextResponse.json({
      success: true,
      teamName: user.teamName,
      email: user.email
    });
  } catch (error) {
    console.error('Error enrolling team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Check if it's a single team check
    const teamName = req.nextUrl.searchParams.get('teamName');
    if (teamName) {
      const user = await User.findOne({ teamName }).select('teamName email isBlocked');
      
      if (!user) {
        return NextResponse.json({
          enrolled: false
        });
      }
      
      return NextResponse.json({
        enrolled: true,
        teamName: user.teamName,
        email: user.email,
        isBlocked: user.isBlocked
      });
    }
    
    // Otherwise, return all teams
    const users = await User.find({}).select('teamName email isBlocked _id');
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error retrieving enrolled teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 