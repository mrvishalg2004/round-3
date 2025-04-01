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
export async function GET(): Promise<NextResponse> {
  try {
    await dbConnect();
    
    // Get the current game state
    let gameState = await GameState.findOne({});
    
    // If no game state exists, create a default one
    if (!gameState) {
      gameState = await GameState.create({
        active: false,
        isPaused: false,
        endTime: null,
        pausedTimeRemaining: null,
        winnersCount: 0,
        gameIsFull: false
      });
    }
    
    // Ensure the game state has all required fields
    const safeGameState = {
      active: gameState.active || false,
      isPaused: gameState.isPaused || false,
      endTime: gameState.endTime || null,
      pausedTimeRemaining: gameState.pausedTimeRemaining || null,
      winnersCount: gameState.winnersCount || 0,
      gameIsFull: gameState.gameIsFull || false
    };
    
    return NextResponse.json({ gameState: safeGameState });
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
    
    const updates = await req.json();
    
    // Get the current game state
    let gameState = await GameState.findOne({});
    
    // If no game state exists, create one
    if (!gameState) {
      gameState = await GameState.create({
        active: false,
        isPaused: false,
        endTime: null,
        pausedTimeRemaining: null,
        winnersCount: 0,
        gameIsFull: false
      });
    }
    
    // Update only the provided fields
    Object.keys(updates).forEach(key => {
      if (key in gameState) {
        gameState[key] = updates[key];
      }
    });
    
    await gameState.save();
    
    // Emit socket event for game state change
    const io = getIO();
    if (io) {
      // Determine the type of state change
      let eventType = 'update';
      if (gameState.active && !gameState.active) eventType = 'start';
      else if (!gameState.active && gameState.active) eventType = 'stop';
      else if (gameState.isPaused && !gameState.isPaused) eventType = 'pause';
      else if (!gameState.isPaused && gameState.isPaused) eventType = 'resume';
      
      emitGameStatusChange({
        type: eventType,
        active: gameState.active,
        endTime: gameState.endTime,
        isPaused: gameState.isPaused,
        remainingTime: gameState.pausedTimeRemaining
      });
    }
    
    return NextResponse.json({ gameState });
  } catch (error) {
    console.error('Error updating game state:', error);
    return NextResponse.json(
      { error: 'Failed to update game state' },
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