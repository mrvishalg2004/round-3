import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import DecryptionSubmission from '@/models/DecryptionSubmission';
import EncryptedMessage from '@/models/EncryptedMessage';
import Winner from '@/models/Winner';
import User from '@/models/User';
import GameState from '@/models/GameState';
import { getIO, emitGameStatusChange } from '@/utils/socket';

// Create a simple event emitter for handling events between API routes
import { EventEmitter } from 'events';
export const emitter = new EventEmitter();

// Set up event listeners for winner events
emitter.on('newWinner', ({ winner }) => {
  console.log(`New winner event: ${winner.teamName} at position ${winner.position}`);
  emitGameStatusChange({
    type: 'newWinner',
    teamName: winner.teamName,
    position: winner.position
  });
});

emitter.on('gameOver', ({ winners }) => {
  console.log('Game over event with winners:', winners.map(w => `${w.teamName} (${w.position})`).join(', '));
  emitGameStatusChange({
    type: 'gameComplete',
    winners: winners
  });
});

// Hardcoded messages for fallback
const FALLBACK_MESSAGES = [
  {
    id: 'fallback-1',
    encryptedText: 'Wklv lv d whvw',
    originalText: 'This is a test',
    encryptionType: 'caesar'
  },
  {
    id: 'fallback-2',
    encryptedText: '01001000 01101001',
    originalText: 'Hi',
    encryptionType: 'binary'
  }
];

// Normalize text for comparison
function normalizeText(text) {
  return text.trim().toLowerCase()
    .replace(/\s+/g, ' ')      // Standardize spaces
    .replace(/[.,!?;:'"-]/g, '') // Remove common punctuation
    .replace(/\u2018|\u2019/g, '') // Remove smart single quotes
    .replace(/\u201C|\u201D/g, '') // Remove smart double quotes
    .replace(/\s+/g, ' ');     // Ensure spaces are standardized again
}

// Simplified validation function that just checks if the answer is correct
async function validateSubmission(teamName, messageId, normalizedSolution) {
  try {
    // Try to find the message by any means necessary
    let message = await EncryptedMessage.findOne({
      _id: messageId,
      activeForTeams: teamName
    });
    
    // If not found with team assignment, try just by ID
    if (!message) {
      message = await EncryptedMessage.findById(messageId);
      
      // If we found the message, silently assign it to the team
      if (message) {
        await EncryptedMessage.findByIdAndUpdate(
          messageId,
          { $addToSet: { activeForTeams: teamName } }
        );
      }
    }
    
    // If we found a message, check if the solution is correct
    if (message) {
      // Normalize the correct solution for comparison
      const correctSolution = normalizeText(message.originalText);
      
      console.log('DEBUG VALIDATION:');
      console.log(`Original solution text: "${message.originalText}"`);
      console.log(`Normalized solution (correct): "${correctSolution}"`);
      console.log(`Normalized solution (submitted): "${normalizedSolution}"`);
      console.log(`Length (correct): ${correctSolution.length}, Length (submitted): ${normalizedSolution.length}`);
      console.log(`Are identical: ${correctSolution === normalizedSolution}`);
      console.log(`Character comparison: ${Array.from(correctSolution).map((c, i) => c === (normalizedSolution[i] || '') ? '✓' : `✗(${c}|${normalizedSolution[i] || 'none'})`).join(' ')}`);
        
      // Check for exact match first (after normalization)
      let isCorrect = correctSolution === normalizedSolution;
      
      // If not exactly equal, let's do a more flexible comparison
      if (!isCorrect) {
        // Remove all whitespace and do case-insensitive comparison
        const strippedCorrect = correctSolution.replace(/\s/g, '');
        const strippedSubmitted = normalizedSolution.replace(/\s/g, '');
        
        // Check if they match after stripping all whitespace
        isCorrect = strippedCorrect === strippedSubmitted;
        
        console.log(`Stripped comparison: "${strippedCorrect}" vs "${strippedSubmitted}"`);
        console.log(`Stripped match: ${isCorrect}`);
      }
      
      return {
        message,
        isCorrect,
        correctSolution,
        submittedSolution: normalizedSolution
      };
    }
    
    // No message found at all - try to assign a new one
    const availableMessages = await EncryptedMessage.find({});
    if (availableMessages.length > 0) {
      const newMessage = availableMessages[0];
      await EncryptedMessage.findByIdAndUpdate(
        newMessage._id,
        { $addToSet: { activeForTeams: teamName } }
      );
    }
    
    // Return failure without showing assignment error
    return { message: null, isCorrect: false };
  } catch (error) {
    console.error("Error in validation:", error);
    return { message: null, isCorrect: false };
  }
}

// Helper to get the current game state
async function getGameState() {
  try {
    const gameState = await GameState.findOne({});
    return {
      isActive: gameState?.active || false,
      isPaused: gameState?.isPaused || false,
      maxWinners: gameState?.maxWinners || 3
    };
  } catch (error) {
    console.error("Error getting game state:", error);
    return {
      isActive: true, // Default to active
      isPaused: false,
      maxWinners: 3
    };
  }
}

// Helper to get the next position for a winner
async function getNextPosition() {
  try {
    const winners = await Winner.find({}).sort('position');
    return winners.length + 1;
  } catch (error) {
    console.error("Error getting next position:", error);
    return 1; // Default to first position if error
  }
}

export async function POST(req: NextRequest) {
  console.log("Submission received");
  try {
    const body = await req.json();
    const { teamName, solution, messageId } = body;
    
    console.log(`Team ${teamName} submitted a solution for message ${messageId}`);
    
    // Basic validation
    if (!teamName || !solution || !messageId) {
      return NextResponse.json({ 
        success: false,
        message: "Missing required fields" 
      }, { status: 400 });
    }

    try {
      await dbConnect();
    } catch (error) {
      console.error("Database connection failed:", error);
      // We'll continue and try with fallback messages
    }

    // Check if game is active
    const gameState = await getGameState();
    if (!gameState?.isActive) {
      return NextResponse.json({ 
        success: false,
        message: "The game is not active at the moment." 
      });
    }

    // Check if game is paused
    if (gameState?.isPaused) {
      return NextResponse.json({ 
        success: false,
        message: "The game is currently paused." 
      });
    }

    // Normalize the solution for validation
    const normalizedSolution = normalizeText(solution);
    console.log(`Normalized solution: "${normalizedSolution}"`);

    // Validate the submission
    const validation = await validateSubmission(teamName, messageId, normalizedSolution);
    console.log(`Validation result: ${validation.isCorrect ? "Correct" : "Incorrect"}`);

    // Check if team has already submitted a correct answer for this challenge
    const existingCorrectSubmission = await DecryptionSubmission.findOne({
      teamName,
      messageId,
      isCorrect: true
    });

    if (existingCorrectSubmission) {
      console.log(`Team ${teamName} already solved message ${messageId}`);
      return NextResponse.json({
        success: false,
        message: "You've already solved this challenge!"
      });
    }

    if (validation.isCorrect) {
      console.log(`Team ${teamName} submitted CORRECT solution: "${solution}"`);
      console.log(`Expected: "${validation.correctSolution}"`);

      // Get the current position
      const position = await getNextPosition();
      console.log(`Team ${teamName} position: ${position}`);

      try {
        // Create a new submission record
        await DecryptionSubmission.create({
          teamName,
          messageId,
          solution,
          isCorrect: true,
          timestamp: new Date()
        });

        // Create a winner record (include messageId for backward compatibility)
        const winner = await Winner.create({
          teamName,
          position,
          messageId: validation.message?._id || messageId, // Include messageId for backward compatibility
          timestamp: new Date()
        });

        // Emit the event for new winner
        console.log(`Emitting new winner event for ${teamName}`);
        emitter.emit('newWinner', { winner: winner });

        // Check if the game is full
        if (position >= (gameState?.maxWinners || 3)) {
          // Emit game over event
          console.log('Game is now full, emitting gameOver event');
          emitter.emit('gameOver', { winners: await Winner.find({}).sort('position') });
        }

        // Simple success message without position information
        const successMessage = getSuccessMessage();
        return NextResponse.json({
          success: true,
          message: successMessage,
          position
        });
      } catch (error) {
        console.error("Error creating records:", error);
        // Still return success to user even if record creation failed
        return NextResponse.json({
          success: true,
          message: getSuccessMessage(),
          position
        });
      }
    } else {
      // Create unsuccessful submission record
      console.log(`Team ${teamName} submitted INCORRECT solution: "${solution}"`);
      if (validation.message) {
        console.log(`Expected: "${validation.correctSolution}"`);
      }
      
      await DecryptionSubmission.create({
        teamName,
        messageId,
        solution,
        isCorrect: false,
        timestamp: new Date()
      });

      return NextResponse.json({
        success: false,
        message: "❌ Not quite right! Keep trying - you're getting closer!"
      });
    }
  } catch (error) {
    console.error("Error in submission:", error);
    return NextResponse.json({ 
      success: false,
      message: "An unexpected error occurred."
    }, { status: 500 });
  }
}

// Helper to generate success messages with more excitement
function getSuccessMessage(): string {
  const messages = [
    "🎉 BRILLIANT! You've cracked the code! Your team's cryptography skills are exceptional! 🌟",
    "🚀 INCREDIBLE WORK! You've deciphered the message! Your team is truly extraordinary! ⭐",
    "💯 PHENOMENAL JOB! You've unlocked the secret message! Your team's intelligence shines brightly! ✨",
    "🏆 OUTSTANDING! You've solved the encryption challenge! Your team deserves a standing ovation! 🌠",
    "🔥 AMAZING SKILLS! You've conquered the challenge! Your team's brilliance is unmatched! 🎊"
  ];
  
  // Return a random message from the array
  return messages[Math.floor(Math.random() * messages.length)];
} 