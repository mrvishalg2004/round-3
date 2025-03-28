import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import EncryptedMessage from '@/models/EncryptedMessage';
import Winner from '@/models/Winner';
import DecryptionSubmission from '@/models/DecryptionSubmission';

export async function GET() {
  try {
    await dbConnect();
    
    // Get all models data for debugging
    const messages = await EncryptedMessage.find({});
    const winners = await Winner.find({});
    const submissions = await DecryptionSubmission.find({});
    
    return NextResponse.json({
      success: true,
      counts: {
        messages: messages.length,
        winners: winners.length,
        submissions: submissions.length
      },
      data: {
        messages,
        winners,
        submissions
      }
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to get debug data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    
    await dbConnect();
    
    // Reset winners
    if (action === 'resetWinners') {
      await Winner.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'Winners reset successfully'
      });
    }
    
    // Reset submissions
    if (action === 'resetSubmissions') {
      await DecryptionSubmission.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'Submissions reset successfully'
      });
    }
    
    // Fix message assignments
    if (action === 'fixMessageAssignments') {
      const messages = await EncryptedMessage.find({});
      
      // Ensure first message is active
      if (messages.length > 0) {
        await EncryptedMessage.updateMany({}, { active: false });
        await EncryptedMessage.findByIdAndUpdate(messages[0]._id, { active: true });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Message assignments fixed'
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Unknown action'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to perform debug action' },
      { status: 500 }
    );
  }
} 