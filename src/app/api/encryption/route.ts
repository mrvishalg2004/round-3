import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import EncryptedMessage from '@/models/EncryptedMessage';
import DecryptionSubmission from '@/models/DecryptionSubmission';
import GameState from '@/models/GameState';
import { hardcodedMessages } from '@/utils/hardcoded-messages';
import Winner from '@/models/Winner';
import { emitTeamMessageAssigned } from '@/utils/socket';

// Helper function to get a random hardcoded message
function getRandomHardcodedMessage() {
  const messageKeys = Object.keys(hardcodedMessages);
  const randomKey = messageKeys[Math.floor(Math.random() * messageKeys.length)];
  return hardcodedMessages[randomKey];
}

// Helper function to get a random message from an array of messages
function getRandomMessage(messages) {
  if (!messages || messages.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

// Helper function to get a deterministic but pseudo-random message based on team name
function getMessageForTeam(messages, teamName) {
  if (!messages || messages.length === 0 || !teamName) return null;
  
  // Create a simple hash from the team name for deterministic selection
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = ((hash << 5) - hash) + teamName.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Use the absolute value of the hash to select a message
  const index = Math.abs(hash) % messages.length;
  return messages[index];
}

// Fallback message in case database is unreachable
const FALLBACK_MESSAGE = {
  id: 'fallback-1',
  encryptedText: 'Wklv lv d whvw',
  hint: '😂 Funny Hint: "Imagine your keyboard got drunk and shifted every letter three places forward."',
  difficulty: 'easy',
  encryptionType: 'caesar',
  active: true
};

// Get current active encrypted message
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/encryption called');
    
    // Get the team name from the query parameters
    const teamName = req.nextUrl.searchParams.get('teamName');
    console.log(`Request from team: ${teamName || 'unknown'}`);
    
    // Prepare a response structure that will be used regardless of DB connectivity
    const response = {
      success: true,
      message: null,
      gameStatus: {
        gameIsFull: false,
        winnersCount: 0,
        active: false,
        isPaused: false
      }
    };
    
    try {
      // Try to connect to the database
      await dbConnect();
      console.log('Connected to database');
      
      // Try to get game state and winners count in parallel
      const [gameState, winnersCount] = await Promise.all([
        GameState.findOne({}),
        Winner.countDocuments()
      ]);
      
      if (gameState) {
        response.gameStatus.active = gameState.active;
        response.gameStatus.isPaused = !!gameState.isPaused;
      }
      
      // If game is not active, return early with waiting state
      if (!response.gameStatus.active) {
        console.log('Game is not active, returning waiting state');
        return NextResponse.json(response);
      }
      
      // If team name is provided and game is active, get/assign a message for this team
      if (teamName && gameState?.active) {
        console.log(`Finding/assigning message for team: ${teamName}`);
        
        // First check if the team already has an assigned message
        let teamMessage = await EncryptedMessage.findOne({ activeForTeams: teamName });
        
        if (teamMessage) {
          console.log(`Team ${teamName} has existing message assigned: ${teamMessage._id} (${teamMessage.encryptionType})`);
        } else {
          // If no assigned message, get a new one
          const availableMessages = await EncryptedMessage.find({});
          
          if (availableMessages.length > 0) {
            teamMessage = getMessageForTeam(availableMessages, teamName) || availableMessages[0];
            
            // Assign the message to the team
            await EncryptedMessage.findByIdAndUpdate(
              teamMessage._id,
              { $addToSet: { activeForTeams: teamName } }
            );
            
            // Notify the team about their assigned message
            try {
              emitTeamMessageAssigned(teamName, teamMessage._id.toString());
            } catch (socketError) {
              console.error('Error emitting team message assignment:', socketError);
            }
          } else {
            // Fallback to active message or create a new one
            teamMessage = await EncryptedMessage.findOne({ active: true }) || 
              await EncryptedMessage.create({
                originalText: "This is a test",
                encryptedText: "Wklv lv d whvw",
                encryptionType: "caesar",
                hint: "😂 Funny Hint: \"Imagine your keyboard got drunk and shifted every letter three places forward.\"",
                difficulty: "easy",
                active: true,
                activeForTeams: [teamName]
              });
          }
        }
        
        // If we found or assigned a message, use it
        if (teamMessage) {
          response.message = {
            id: teamMessage._id.toString(),
            encryptedText: teamMessage.encryptedText,
            hint: teamMessage.hint,
            difficulty: teamMessage.difficulty,
            encryptionType: teamMessage.encryptionType,
            active: true
          };
        } else {
          response.message = FALLBACK_MESSAGE;
        }
      } else if (!teamName) {
        // No team name provided, use global active message (backward compatibility)
        const message = await EncryptedMessage.findOne({ active: true });
        
        if (message) {
          response.message = {
            id: message._id.toString(),
            encryptedText: message.encryptedText,
            hint: message.hint,
            difficulty: message.difficulty,
            encryptionType: message.encryptionType,
            active: message.active
          };
        }
      }
      
      // Update game status with winners count
      response.gameStatus.winnersCount = winnersCount;
      response.gameStatus.gameIsFull = winnersCount >= 3; // MAX_WINNERS
      
    } catch (dbError) {
      console.error('Database error in encryption endpoint:', dbError);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in encryption endpoint:', error);
    return NextResponse.json({
      success: true,
      message: FALLBACK_MESSAGE,
      gameStatus: {
        gameIsFull: false,
        winnersCount: 0,
        active: false,
        isPaused: false
      }
    });
  }
} 