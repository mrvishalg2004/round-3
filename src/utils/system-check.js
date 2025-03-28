/**
 * Database system check - validates and fixes schema mismatches
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-rush';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Define all models with their correct schemas
function defineModels() {
  // Clear existing models to avoid conflicts
  mongoose.models = {};
  
  // User Model
  const UserSchema = new mongoose.Schema({
    teamName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
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
  }, { timestamps: true });
  
  // GameState Model
  const GameStateSchema = new mongoose.Schema({
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
    },
    duration: {
      type: Number,
      default: 20 * 60 * 1000 // 20 minutes
    }
  });
  
  // EncryptedMessage Model
  const EncryptedMessageSchema = new mongoose.Schema({
    originalText: {
      type: String,
      required: true,
      trim: true
    },
    encryptedText: {
      type: String,
      required: true,
      trim: true
    },
    encryptionType: {
      type: String,
      required: true,
      enum: ['caesar', 'base64', 'morse', 'binary', 'reverse', 'mixed', 'rot13', 'hex', 'atbash', 'md5'],
      trim: true
    },
    hint: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    active: {
      type: Boolean,
      default: false
    }
  });
  
  // Winner Model
  const WinnerSchema = new mongoose.Schema({
    teamName: {
      type: String,
      required: true
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EncryptedMessage',
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // DecryptionSubmission Model
  const DecryptionSubmissionSchema = new mongoose.Schema({
    teamName: {
      type: String,
      required: true
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EncryptedMessage',
      required: true
    },
    submittedText: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    position: {
      type: Number,
      default: null
    },
    isWinner: {
      type: Boolean,
      default: false
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create models
  const User = mongoose.model('User', UserSchema);
  const GameState = mongoose.model('GameState', GameStateSchema);
  const EncryptedMessage = mongoose.model('EncryptedMessage', EncryptedMessageSchema);
  const Winner = mongoose.model('Winner', WinnerSchema);
  const DecryptionSubmission = mongoose.model('DecryptionSubmission', DecryptionSubmissionSchema);
  
  return {
    User,
    GameState,
    EncryptedMessage,
    Winner,
    DecryptionSubmission
  };
}

// Initialize the database with sample data
async function initializeDatabase(models) {
  const { User, GameState, EncryptedMessage, Winner, DecryptionSubmission } = models;
  
  // Check if we need to initialize
  const adminExists = await User.findOne({ isAdmin: true });
  if (adminExists) {
    console.log('Database already initialized with admin user');
    return false;
  }
  
  console.log('Initializing database with sample data...');
  
  // Clear existing data
  await User.deleteMany({});
  await GameState.deleteMany({});
  await EncryptedMessage.deleteMany({});
  await Winner.deleteMany({});
  await DecryptionSubmission.deleteMany({});
  
  // Create admin user
  await User.create({
    teamName: 'Admin',
    email: 'admin@example.com',
    isAdmin: true,
    isBlocked: false
  });
  
  // Create sample teams
  const teams = [
    {
      teamName: 'Team Alpha',
      email: 'alpha@example.com',
      isAdmin: false,
      isBlocked: false
    },
    {
      teamName: 'Team Beta',
      email: 'beta@example.com',
      isAdmin: false,
      isBlocked: false
    },
    {
      teamName: 'Team Gamma',
      email: 'gamma@example.com',
      isAdmin: false,
      isBlocked: true,
      blockReason: 'Blocked for testing'
    }
  ];
  
  await User.insertMany(teams);
  
  // Create default game state (inactive)
  await GameState.create({
    active: false,
    startTime: null,
    endTime: null,
    isPaused: false,
    pausedTimeRemaining: 0,
    duration: 20 * 60 * 1000 // 20 minutes
  });
  
  // Create sample encrypted messages
  const messages = [
    {
      originalText: "This is a test",
      encryptedText: "Wklv lv d whvw",
      encryptionType: "caesar",
      hint: "😂 Funny Hint: \"Imagine your keyboard got drunk and shifted every letter three places forward.\"",
      difficulty: "easy",
      active: true
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
    }
  ];
  
  await EncryptedMessage.insertMany(messages);
  
  console.log('Database initialized successfully');
  return true;
}

// List all collections and their counts
async function listCollections() {
  console.log('\n=== Database Collections ===');
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const collection of collections) {
    const count = await mongoose.connection.db.collection(collection.name).countDocuments();
    console.log(`- ${collection.name}: ${count} documents`);
  }
}

// Run the system check
async function runSystemCheck() {
  try {
    // Connect to database
    const connected = await connectToDatabase();
    if (!connected) {
      process.exit(1);
    }
    
    // Define models
    const models = defineModels();
    
    // Initialize database if needed
    await initializeDatabase(models);
    
    // List all collections
    await listCollections();
    
    console.log('\nSystem check completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('System check failed:', error);
    process.exit(1);
  }
}

// Run the script
runSystemCheck(); 