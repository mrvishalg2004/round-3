import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import GameState from '@/models/GameState';
import EncryptedMessage from '@/models/EncryptedMessage';
import DecryptionSubmission from '@/models/DecryptionSubmission';
import Winner from '@/models/Winner';
import { getIO, emitGameStatusChange } from '@/utils/socket';

export async function POST() {
  try {
    console.log("Reset endpoint called");
    
    // Create a response to be sent regardless of database operations
    const successResponse = {
      success: true,
      message: 'Game has been reset successfully',
      gameState: {
        active: false,
        startTime: null,
        endTime: null,
        isPaused: false,
        pausedTimeRemaining: 0
      }
    };
    
    try {
      await dbConnect();
      console.log("Connected to database");
      
      // Reset game state - IMPORTANT: set active to false
      const gameState = await GameState.findOneAndUpdate(
        {},
        {
          active: false,
          startTime: null,
          endTime: null,
          isPaused: false,
          pausedTimeRemaining: 0
        },
        { new: true, upsert: true }
      );
      
      // Clear all existing messages
      await EncryptedMessage.deleteMany({});
      console.log("Cleared existing messages");
      
      // Add new custom messages with funny hints
      const messages = [
        {
          originalText: "This is a test",
          encryptedText: "Wklv lv d whvw",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"Imagine your keyboard got drunk and shifted every letter three places forward.\"",
          difficulty: "easy",
          active: false
        },
        {
          originalText: "Hi",
          encryptedText: "01001000 01101001",
          encryptionType: "binary",
          hint: "😂 Funny Hint: \"Robots use this language. You see 0s and 1s, but they see words.\"",
          difficulty: "medium",
          active: false
        },
        {
          originalText: "Something secret",
          encryptedText: "U29tZXRoaW5nIHNlY3JldA==",
          encryptionType: "base64",
          hint: "😂 Funny Hint: \"This message took a vacation and got sunburned in Base64.\"",
          difficulty: "medium",
          active: false
        },
        {
          originalText: "The code is 13",
          encryptedText: "Gur pbqr vf 13",
          encryptionType: "rot13",
          hint: "😂 Funny Hint: \"Move each letter 13 places, and you'll see the secret. It's like playing hide and seek with letters.\"",
          difficulty: "medium"
        },
        {
          originalText: "coding in This and have no idea",
          encryptedText: "xlfowq rm Gsrh zmw zyvg lu gsv xlwv",
          encryptionType: "atbash",
          hint: "😂 Funny Hint: \"Flip the alphabet! A = Z, B = Y... kinda like reversing your car into a parking spot.\"",
          difficulty: "hard"
        },
        {
          originalText: "Good Luck",
          encryptedText: "47 6f 6f 64 20 4c 75 63 6b",
          encryptionType: "hex",
          hint: "😂 Funny Hint: \"Numbers in disguise! Convert these sneaky hex codes to text.\"",
          difficulty: "medium"
        },
        {
          originalText: "Hello, my name is Vishal",
          encryptedText: "Khoor, zl qdph lv Vlvkdo",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"Every letter took three steps forward... probably trying to escape the message.\"",
          difficulty: "easy"
        },
        {
          originalText: "Sorry, this one is one-way encrypted",
          encryptedText: "e6b97ed5c6 3a347c 19b7b",
          encryptionType: "md5",
          hint: "😂 Funny Hint: \"You can try, but you ain't reversing this! It's like trying to unburn toast.\"",
          difficulty: "hard"
        },
        {
          originalText: "Mind your own business?",
          encryptedText: "B2luZCB5b3VyIG93biBidXNpbmVzcz8=",
          encryptionType: "base64",
          hint: "😂 Funny Hint: \"Base64 strikes again! Looks like a WiFi password, but it's actually words in disguise.\"",
          difficulty: "medium"
        },
        {
          originalText: "Hello Friend",
          encryptedText: "48656c6c6f20467269656e64",
          encryptionType: "hex",
          hint: "😂 Funny Hint: \"It's just 'Hello Friend' but pretending to be a computer nerd.\"",
          difficulty: "medium"
        },
        {
          originalText: "Hey there!",
          encryptedText: "xuo jxuhu!",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"Imagine someone typing this while wearing boxing gloves… it's all shifted weird.\"",
          difficulty: "medium"
        },
        {
          originalText: "Love do not get monsters",
          encryptedText: "Nbyr qb abg trg zbafgref",
          encryptionType: "rot13",
          hint: "😂 Funny Hint: \"This message is doing a 13-step dance. Spin the letters back 13 places!\"",
          difficulty: "medium"
        },
        {
          originalText: "There is a secret",
          encryptedText: "Uifsf jt b tfdsfu",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"Every letter moved one step forward, like it's shy and trying to avoid you.\"",
          difficulty: "easy"
        },
        {
          originalText: "Hello World",
          encryptedText: "Mjqqt Btwqi",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"If 'Hello World' had a little too much caffeine and jumped five letters forward.\"",
          difficulty: "easy"
        },
        {
          originalText: "hello",
          encryptedText: "5d41402abc4b2a76b9719d911017c592",
          encryptionType: "md5",
          hint: "😂 Funny Hint: \"If you can reverse this, you're probably a hacker. But no worries, it just says 'hello'.\"",
          difficulty: "hard"
        },
        {
          originalText: "Hello, human",
          encryptedText: "24 65 6c 6c 6f 2c 20 68 75 6d 61 6e",
          encryptionType: "hex",
          hint: "😂 Funny Hint: \"This message is hiding in hexadecimal. It's basically cosplaying as numbers.\"",
          difficulty: "medium"
        },
        {
          originalText: "Decode the secret message",
          encryptedText: "Plorehq wkh vhfuhw phvvdjh",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"Looks scrambled? It's just your normal message, but the letters moved three places ahead.\"",
          difficulty: "medium"
        },
        {
          originalText: "Hello, Bot! MainProgram",
          encryptedText: "Jgnnq, Dqvc! OckpVqhtqho",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"This message is running a bit ahead... like five steps ahead in the alphabet!\"",
          difficulty: "medium"
        }
      ];
      
      // Insert into database
      await EncryptedMessage.insertMany(messages);
      console.log("Added new messages");
      
      // Get all team names before clearing assignments
      const allMessages = await EncryptedMessage.find({});
      const allTeams = new Set();
      
      for (const message of allMessages) {
        if (message.activeForTeams && Array.isArray(message.activeForTeams)) {
          message.activeForTeams.forEach(team => allTeams.add(team));
        }
      }
      
      console.log(`Found ${allTeams.size} teams with message assignments`);
      
      // Clear all team assignments from other messages
      await EncryptedMessage.updateMany(
        {},
        { 
          active: false,
          activeForTeams: [] // Reset all team assignments
        }
      );
      
      // Set the first one as active and assign all teams to it
      const firstMessage = await EncryptedMessage.findOneAndUpdate(
        { encryptionType: "caesar", originalText: "This is a test" }, 
        { 
          active: true,
          activeForTeams: [...allTeams] // Add all teams to the active message
        },
        { new: true }
      );
      
      console.log(`Reset all message assignments and set message ${firstMessage?._id} as active for all ${allTeams.size} teams`);
      
      // Clear submissions and winners
      await DecryptionSubmission.deleteMany({});
      await Winner.deleteMany({});
      console.log("Cleared submissions and winners");
      
      // Update the success response with the actual game state
      successResponse.gameState = gameState;
      
    } catch (dbError) {
      console.error('Database operation failed during reset:', dbError);
      // Continue execution - we'll still return success and attempt to emit socket event
    }
    
    // Emit socket event to notify clients that game is reset and inactive
    try {
      emitGameStatusChange({
        active: false,
        isPaused: false,
        endTime: null,
        pausedTimeRemaining: 0,
        reset: true,
        type: 'reset'
      });
      console.log("Emitted game reset event");
    } catch (socketError) {
      console.error('Error emitting game reset event:', socketError);
    }
    
    // Always return success to client
    return NextResponse.json(successResponse);
  } catch (error) {
    console.error('Unexpected error in reset endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to reset game' },
      { status: 500 }
    );
  }
} 