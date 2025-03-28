import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { getIO, emitTeamStatusChange } from '@/utils/socket';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const { teamName } = await request.json();
    
    if (!teamName) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }
    
    // Find the team by name
    const team = await User.findOne({ teamName });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Update the team's status
    team.isBlocked = false;
    team.blockReason = null;
    
    await team.save();
    
    // Emit socket event to notify clients
    try {
      emitTeamStatusChange(team.teamName, false, 'Your team has been unblocked by an administrator.');
    } catch (socketError) {
      console.error('Error emitting team status change:', socketError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Team "${teamName}" has been unblocked`,
      team: {
        teamName: team.teamName,
        email: team.email,
        isBlocked: team.isBlocked
      }
    });
  } catch (error) {
    console.error('Error unblocking team:', error);
    return NextResponse.json(
      { error: 'Failed to unblock team' },
      { status: 500 }
    );
  }
} 