import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import EncryptedMessage from '@/models/EncryptedMessage';
import { getIO, emitActiveMessageChanged } from '@/utils/socket';

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }
    
    // First, deactivate all messages
    await EncryptedMessage.updateMany({}, { active: false });
    
    // Then, activate the specified message
    const message = await EncryptedMessage.findByIdAndUpdate(
      id,
      { active: true },
      { new: true }
    );
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }
    
    // Emit socket event to notify clients about the new active message
    try {
      emitActiveMessageChanged(message._id.toString());
    } catch (socketError) {
      console.error('Error emitting active message change:', socketError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Message activated successfully',
      activeMessage: {
        _id: message._id,
        encryptionType: message.encryptionType,
        difficulty: message.difficulty,
        hint: message.hint
      }
    });
  } catch (error) {
    console.error('Error activating message:', error);
    return NextResponse.json(
      { error: 'Failed to activate message' },
      { status: 500 }
    );
  }
} 