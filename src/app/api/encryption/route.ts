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
      
      // Try to get game state
      const gameState = await GameState.findOne({});
      
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
        }
        
        // If no assigned message, assign a new one based on team name
        if (!teamMessage) {
          console.log(`No message assigned to team ${teamName}, assigning new message`);
          
          // Get all available messages
          const availableMessages = await EncryptedMessage.find({});
          
          if (availableMessages.length > 0) {
            console.log(`Found ${availableMessages.length} available messages to choose from`);
            
            try {
              // Get a message deterministically based on team name
              teamMessage = getMessageForTeam(availableMessages, teamName);
              
              // Assign this message to the team
              if (teamMessage) {
                console.log(`Selected message "${teamMessage.encryptionType}" for team "${teamName}" based on hash`);
                
                await EncryptedMessage.findByIdAndUpdate(
                  teamMessage._id,
                  { $addToSet: { activeForTeams: teamName } }
                );
                
                console.log(`Assigned message "${teamMessage.encryptionType}" to team "${teamName}"`);
                
                // Notify the team about their assigned message
                try {
                  emitTeamMessageAssigned(teamName, teamMessage._id.toString());
                } catch (socketError) {
                  console.error('Error emitting team message assignment:', socketError);
                }
              } else {
                console.error(`Failed to select message for team ${teamName}, using first available`);
                // Fallback to first message if hash method fails for any reason
                teamMessage = availableMessages[0];
                await EncryptedMessage.findByIdAndUpdate(
                  teamMessage._id,
                  { $addToSet: { activeForTeams: teamName } }
                );
              }
            } catch (error) {
              console.error("Error in message assignment:", error);
              // Last resort fallback - use first message
              teamMessage = availableMessages[0];
              await EncryptedMessage.findByIdAndUpdate(
                teamMessage._id,
                { $addToSet: { activeForTeams: teamName } }
              );
            }
          } else {
            console.log('No messages available, falling back to active message');
            
            // Fallback to active message if no messages to shuffle
            const activeMessage = await EncryptedMessage.findOne({ active: true });
            
            if (activeMessage) {
              teamMessage = activeMessage;
              console.log(`Using active message for team ${teamName}: ${activeMessage._id}`);
              
              await EncryptedMessage.findByIdAndUpdate(
                activeMessage._id,
                { $addToSet: { activeForTeams: teamName } }
              );
              
              // Notify the team about their assigned message
              try {
                emitTeamMessageAssigned(teamName, activeMessage._id.toString());
              } catch (socketError) {
                console.error('Error emitting team message assignment:', socketError);
              }
            } else {
              console.error('No active message found for fallback - creating one');
              
              // Last resort - no messages at all, create a default message
              try {
                const defaultMessage = await EncryptedMessage.create({
                  originalText: "This is a test",
                  encryptedText: "Wklv lv d whvw",
                  encryptionType: "caesar",
                  hint: "😂 Funny Hint: \"Imagine your keyboard got drunk and shifted every letter three places forward.\"",
                  difficulty: "easy",
                  active: true,
                  activeForTeams: [teamName]
                });
                
                teamMessage = defaultMessage;
                console.log(`Created default message for team ${teamName}: ${defaultMessage._id}`);
              } catch (createError) {
                console.error('Failed to create default message:', createError);
              }
            }
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
          
          console.log(`Serving message "${teamMessage.encryptionType}" to team "${teamName}"`);
        } else {
          console.error(`Failed to find or assign message for team ${teamName}, using fallback`);
          
          // We couldn't find or assign a message, so use the fallback
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
      
      // Get winners count
      const winnersCount = await Winner.countDocuments();
      response.gameStatus.winnersCount = winnersCount;
      
      const MAX_WINNERS = 3; // Adjust as needed
      response.gameStatus.gameIsFull = winnersCount >= MAX_WINNERS;
      
    } catch (dbError) {
      console.error('Database error in encryption endpoint:', dbError);
      // Continue with fallback message if DB fails
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in encryption endpoint:', error);
    // Even if there's an unexpected error, return the fallback message
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