import mongoose, { Schema, Document } from 'mongoose';

export interface IDecryptionSubmission extends Document {
  teamName: string;
  email?: string;
  messageId: mongoose.Types.ObjectId;
  solution: string;
  isCorrect: boolean;
  position?: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DecryptionSubmissionSchema: Schema = new Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'EncryptedMessage',
      required: [true, 'Message ID is required']
    },
    solution: {
      type: String,
      required: [true, 'Solution is required'],
      trim: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    position: {
      type: Number,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Get DecryptionSubmission model or create it if it doesn't exist
export default mongoose.models.DecryptionSubmission || mongoose.model<IDecryptionSubmission>('DecryptionSubmission', DecryptionSubmissionSchema); 