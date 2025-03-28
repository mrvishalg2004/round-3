import mongoose, { Schema, Document } from 'mongoose';

export interface IWinner extends Document {
  teamName: string;
  position: number;
  messageId?: mongoose.Types.ObjectId; // Optional for backward compatibility
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WinnerSchema: Schema = new Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true
    },
    position: {
      type: Number,
      required: [true, 'Position is required'],
      min: 1
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'EncryptedMessage',
      // Now optional
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Add a unique compound index to prevent duplicate entries for same position
WinnerSchema.index({ position: 1 }, { unique: true });

// Get Winner model or create it if it doesn't exist
export default mongoose.models.Winner || mongoose.model<IWinner>('Winner', WinnerSchema); 