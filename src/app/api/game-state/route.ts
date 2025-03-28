import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import GameState from '@/models/GameState';
import { getIO, emitGameStatusChange } from '@/utils/socket';

// Define default game duration
const DEFAULT_GAME_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// Helper function to get the game state from MongoDB
const getGameState = async () => {
  try {
    await dbConnect();
    // Get the default game state or create if it doesn't exist
    let gameState = await GameState.findOne({ isDefault: true });
    
    if (!gameState) {
      // Create default game state if none exists
      gameState = await GameState.create({
        active: false,
        startTime: null,
        endTime: null,
        duration: DEFAULT_GAME_DURATION,
        isPaused: false,
        pausedTimeRemaining: 0,
        isDefault: true
      });
    }
    
    return gameState;
  } catch (error) {
    console.error('Error getting game state:', error);
    throw error;
  }
};

// GET /api/game-state
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    
    // Find the current game state (or the default one)
    const gameState = await GameState.findOne({}) || await createDefaultGameState();
    
    return NextResponse.json({
      active: gameState.active,
      startTime: gameState.startTime,
      endTime: gameState.endTime,
      isPaused: gameState.isPaused,
      pausedTimeRemaining: gameState.pausedTimeRemaining
    });
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game state' },
      { status: 500 }
    );
  }
}

// PUT /api/game-state
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    
    const { active, endTime, isPaused } = await req.json();
    
    // Find current game state
    let gameState = await GameState.findOne({});
    
    if (!gameState) {
      gameState = await createDefaultGameState();
    }

    console.log('Received game state update:', { active, endTime, isPaused });
    console.log('Current game state:', gameState);
    
    // Calculate remaining time if pausing
    let pausedTimeRemaining = gameState.pausedTimeRemaining || 0;
    if (isPaused && !gameState.isPaused && gameState.endTime) {
      const now = new Date();
      const end = new Date(gameState.endTime);
      pausedTimeRemaining = Math.max(0, end.getTime() - now.getTime());
    }
    
    // Calculate new end time if resuming
    let newEndTime = null;
    if (endTime) {
      // If endTime is provided directly
      newEndTime = new Date(endTime);
      // Validate it's a valid date
      if (isNaN(newEndTime.getTime())) {
        newEndTime = null;
      }
    } else if (gameState.isPaused && isPaused === false && gameState.pausedTimeRemaining > 0) {
      // If resuming from pause
      const now = new Date();
      newEndTime = new Date(now.getTime() + gameState.pausedTimeRemaining);
    }
    
    // If activating the game, set start time to now
    let startTime = gameState.startTime;
    if (active === true && !gameState.active) {
      startTime = new Date();
      
      // If no end time provided and game is being activated, set default duration
      if (!newEndTime) {
        newEndTime = new Date(startTime.getTime() + (gameState.duration || 20 * 60 * 1000));
      }
    }
    
    // Prepare update object with careful handling of null/undefined values
    const updateObj = {
      active: active !== undefined ? active : gameState.active
    };
    
    // Only set fields that need to be updated with proper null handling
    if (startTime !== undefined) {
      updateObj.startTime = startTime;
    }
    
    if (newEndTime !== undefined) {
      updateObj.endTime = newEndTime;
    } else if (active === false) {
      // Clear end time when stopping game
      updateObj.endTime = null;
    }
    
    if (isPaused !== undefined) {
      updateObj.isPaused = isPaused;
    }
    
    updateObj.pausedTimeRemaining = pausedTimeRemaining;
    
    // Update the game state
    const updatedGameState = await GameState.findOneAndUpdate(
      { _id: gameState._id },
      { $set: updateObj },
      { new: true }
    );
    
    console.log('Updated game state:', updatedGameState);
    
    // Emit socket event for game state change
    const io = getIO();
    if (io) {
      // Determine the type of state change
      let eventType = 'update';
      if (active && !gameState.active) eventType = 'start';
      else if (!active && gameState.active) eventType = 'stop';
      else if (isPaused && !gameState.isPaused) eventType = 'pause';
      else if (!isPaused && gameState.isPaused) eventType = 'resume';
      
      emitGameStatusChange({
        type: eventType,
        active: updatedGameState.active,
        endTime: updatedGameState.endTime,
        isPaused: updatedGameState.isPaused,
        remainingTime: updatedGameState.pausedTimeRemaining
      });
    }
    
    return NextResponse.json({
      success: true,
      gameState: {
        active: updatedGameState.active,
        startTime: updatedGameState.startTime,
        endTime: updatedGameState.endTime,
        isPaused: updatedGameState.isPaused,
        pausedTimeRemaining: updatedGameState.pausedTimeRemaining
      }
    });
  } catch (error) {
    console.error('Error updating game state:', error);
    return NextResponse.json(
      { error: 'Failed to update game state', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to create a default game state
async function createDefaultGameState() {
  const defaultGameState = new GameState({
    active: false,
    startTime: new Date(),
    endTime: null,
    duration: 20 * 60 * 1000, // 20 minutes
    isPaused: false,
    pausedTimeRemaining: 0,
    isDefault: true
  });
  
  await defaultGameState.save();
  return defaultGameState;
} 