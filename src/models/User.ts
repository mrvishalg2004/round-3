import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  teamName: string;
  email: string;
  isAdmin: boolean;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Get User model or create it if it doesn't exist
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 