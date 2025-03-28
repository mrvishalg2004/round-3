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
    
    // Don't allow blocking admin users
    if (team.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot block an admin user' },
        { status: 403 }
      );
    }
    
    // Update the team's status
    team.isBlocked = true;
    team.blockReason = reason || 'Blocked by administrator';
    
    await team.save();
    
    // Emit socket event to notify clients
    try {
      emitTeamStatusChange(team.teamName, true);
    } catch (socketError) {
      console.error('Error emitting team status change:', socketError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Team "${teamName}" has been blocked`,
      team: {
        teamName: team.teamName,
        email: team.email,
        isBlocked: team.isBlocked
      }
    });
  } catch (error) {
    console.error('Error blocking team:', error);
    return NextResponse.json(
      { error: 'Failed to block team' },
      { status: 500 }
    );
  }
} 