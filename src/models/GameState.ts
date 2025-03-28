import mongoose, { Schema, Document } from 'mongoose';

export interface IGameState extends Document {
  active: boolean;
  startTime: Date | null;
  endTime: Date | null;
  isPaused: boolean;
  pausedTimeRemaining: number;
  createdAt: Date;
  updatedAt: Date;
}

const GameStateSchema: Schema = new Schema(
  {
    active: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    pausedTimeRemaining: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Get GameState model or create it if it doesn't exist
export default mongoose.models.GameState || mongoose.model<IGameState>('GameState', GameStateSchema); 