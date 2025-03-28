import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import EncryptedMessage from '@/models/EncryptedMessage';
import DecryptionSubmission from '@/models/DecryptionSubmission';
import Winner from '@/models/Winner';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get active message
    const message = await EncryptedMessage.findOne({ active: true });
    
    if (!message) {
      return NextResponse.json(
        { error: 'No active encrypted message found' },
        { status: 404 }
      );
    }
    
    // Get winners for this message
    const winners = await DecryptionSubmission.find({
      messageId: message._id,
      isWinner: true
    })
    .sort({ position: 1 })
    .select('teamName position createdAt');
    
    return NextResponse.json({
      messageId: message._id,
      winners,
      totalWinners: winners.length,
      gameIsFull: winners.length >= 3
    });
  } catch (error) {
    console.error('Error fetching winners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch winners' },
      { status: 500 }
    );
  }
}

export async function GETWinner() {
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