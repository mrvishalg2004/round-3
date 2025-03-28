import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import EncryptedMessage from '@/models/EncryptedMessage';
import GameState from '@/models/GameState';
import User from '@/models/User';

// Function to encrypt a message using Caesar cipher with shift 3
function caesarCipher(text: string, shift: number): string {
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      
      // Handle uppercase letters
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }
      
      // Handle lowercase letters
      if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + shift) % 26) + 97);
      }
      
      // Return non-alphabet characters as is
      return char;
    })
    .join('');
}

// Function to encode text to Base64
function base64Encode(text: string): string {
  return Buffer.from(text).toString('base64');
}

// Function to convert text to Morse code
function textToMorse(text: string): string {
  const morseCode: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.',
    ' ': '/'
  };
  
  return text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ');
}

// Function to convert text to binary
function textToBinary(text: string): string {
  return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

// Function to reverse a string
function reverseString(text: string): string {
  return text.split('').reverse().join('');
}

// Generate a hint based on the encryption method
function generateHint(encryptionType: string): string {
  const hints: Record<string, string[]> = {
    'caesar': [
      'Each letter has been shifted forward in the alphabet.',
      'Think of Julius Caesar and his secret messages.',
      'An ancient Roman encryption technique has been used here.'
    ],
    'base64': [
      'This message has been encoded into a different character set.',
      'A common encoding method used in computing is at work here.',
      'Look for patterns of letters, numbers, and possibly + or / symbols.'
    ],
    'morse': [
      'Dots and dashes hide the true message.',
      'This encoding was used in early telecommunications.',
      'SOS ... --- ...'
    ],
    'binary': [
      'The message has been converted to the language computers understand at the lowest level.',
      'Only two symbols are used in this encoding.',
      'Think in terms of 0s and 1s.'
    ],
    'reverse': [
      'Try reading this message from the opposite direction.',
      'The message appears backward.',
      'What you see is the mirror image of the truth.'
    ]
  };
  
  // Randomly select a hint for the given encryption type
  const typeHints = hints[encryptionType] || [];
  return typeHints[Math.floor(Math.random() * typeHints.length)];
}

// Function to encrypt a message based on type
function encryptMessage(text: string, type: string): { encryptedText: string; hint: string } {
  switch(type) {
    case 'caesar':
      return { 
        encryptedText: caesarCipher(text, 3),
        hint: generateHint('caesar')
      };
    case 'base64':
      return { 
        encryptedText: base64Encode(text),
        hint: generateHint('base64')
      };
    case 'morse':
      return { 
        encryptedText: textToMorse(text),
        hint: generateHint('morse')
      };
    case 'binary':
      return { 
        encryptedText: textToBinary(text),
        hint: generateHint('binary')
      };
    case 'reverse':
      return { 
        encryptedText: reverseString(text),
        hint: generateHint('reverse')
      };
    default:
      return { 
        encryptedText: text,
        hint: "No encryption applied."
      };
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    // Check if we already have a game state
    const existingGameState = await GameState.findOne({});
    
    // Create a default game state if none exists
    if (!existingGameState) {
      await GameState.create({
        active: false, // Default to inactive - admin must start the game
        startTime: null,
        endTime: null,
        isPaused: false,
        pausedTimeRemaining: 0,
        duration: 20 * 60 * 1000 // 20 minutes in milliseconds
      });
      console.log('Created default game state');
    }
    
    // Check if we have encrypted messages
    const messagesCount = await EncryptedMessage.countDocuments();
    
    // Create encrypted messages if none exist
    if (messagesCount === 0) {
      // Custom messages with funny hints
      const messages = [
        {
          originalText: "This is a test",
          encryptedText: "Wklv lv d whvw",
          encryptionType: "caesar",
          hint: "😂 Funny Hint: \"Imagine your keyboard got drunk and shifted every letter three places forward.\"",
          difficulty: "easy"
        },
        {
          originalText: "Hi",
          encryptedText: "01001000 01101001",
          encryptionType: "binary",
          hint: "😂 Funny Hint: \"Robots use this language. You see 0s and 1s, but they see words.\"",
          difficulty: "medium"
        },
        {
          originalText: "Something secret",
          encryptedText: "U29tZXRoaW5nIHNlY3JldA==",
          encryptionType: "base64",
          hint: "😂 Funny Hint: \"This message took a vacation and got sunburned in Base64.\"",
          difficulty: "medium"
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
      
      // Set the first one as active
      await EncryptedMessage.findOneAndUpdate(
        { encryptionType: "caesar", originalText: "This is a test" }, 
        { active: true }
      );
    }
    
    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ isAdmin: true });
    
    if (!adminExists) {
      try {
        await User.create({
          teamName: 'Admin',
          email: 'admin@example.com',
          isAdmin: true,
          isBlocked: false
        });
        console.log('Created admin user successfully');
      } catch (userErr) {
        console.error('Error creating admin user:', userErr);
        // Continue even if admin user creation fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
} 