import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import EncryptedMessage from '@/models/EncryptedMessage';

export async function GET() {
  try {
    await dbConnect();
    
    const messages = await EncryptedMessage.find({}).select('encryptionType difficulty hint active activeForTeams');
    
    return NextResponse.json({ messages, success: true });
  } catch (error) {
    console.error('Error fetching encrypted messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encrypted messages' },
      { status: 500 }
    );
  }
} 