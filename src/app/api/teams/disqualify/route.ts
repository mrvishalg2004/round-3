import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import { getIO, emitTeamStatusChange } from '@/utils/socket';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const { teamName, reason } = await request.json();
    
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
    
    // Don't allow disqualifying admin users
    if (team.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot disqualify an admin user' },
        { status: 403 }
      );
    }
    
    // Update the team's status
    team.isBlocked = true;
    team.blockReason = reason || 'Disqualified for security violations';
    
    await team.save();
    
    // Log disqualification for monitoring
    console.log(`SECURITY ALERT: Team "${teamName}" has been disqualified. Reason: ${reason}`);
    
    // Emit socket event to notify clients
    try {
      emitTeamStatusChange(team.teamName, true, 'Your team has been disqualified for security violations.');
    } catch (socketError) {
      console.error('Error emitting team status change:', socketError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Team "${teamName}" has been disqualified`,
      team: {
        teamName: team.teamName,
        email: team.email,
        isBlocked: team.isBlocked,
        reason: team.blockReason
      }
    });
  } catch (error) {
    console.error('Error disqualifying team:', error);
    return NextResponse.json(
      { error: 'Failed to disqualify team' },
      { status: 500 }
    );
  }
} 