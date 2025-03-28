const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// MongoDB connection
async function connectToMongoDB() {
  try {
    // Try connecting to localhost MongoDB first
    await mongoose.connect('mongodb://localhost:27017/code-rush');
    console.log('Connected to local MongoDB');
    return true;
  } catch (localError) {
    console.error('Failed to connect to local MongoDB:', localError.message);
    
    try {
      // Fall back to in-memory MongoDB
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('Connected to in-memory MongoDB');
      return true;
    } catch (memoryError) {
      console.error('Failed to start in-memory MongoDB:', memoryError.message);
      return false;
    }
  }
}

// Define User schema
const UserSchema = new mongoose.Schema(
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

// Define models
async function createModels() {
  // Remove models if they exist to avoid OverwriteModelError
  mongoose.models = {};
  
  // Create User model
  const User = mongoose.model('User', UserSchema);
  
  // Create GameState model
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
      default: 20 * 60 * 1000 // 20 minutes in milliseconds
    }
  });
  
  const GameState = mongoose.model('GameState', GameStateSchema);
  
  // Create EncryptedMessage model
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
  
  const EncryptedMessage = mongoose.model('EncryptedMessage', EncryptedMessageSchema);
  
  return { User, GameState, EncryptedMessage };
}

// Insert sample data
async function insertSampleData(models) {
  const { User, GameState, EncryptedMessage } = models;
  
  // Clear existing data
  await User.deleteMany({});
  await GameState.deleteMany({});
  await EncryptedMessage.deleteMany({});
  
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
  
  // Create active game state
  await GameState.create({
    active: true,
    startTime: new Date(),
    endTime: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
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
  
  console.log('Sample data inserted successfully');
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      console.error('Failed to connect to any MongoDB instance');
      process.exit(1);
    }
    
    // Create models
    const models = await createModels();
    
    // Insert sample data
    await insertSampleData(models);
    
    console.log('Local MongoDB initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing local MongoDB:', error);
    process.exit(1);
  }
}

// Run the script
main(); 