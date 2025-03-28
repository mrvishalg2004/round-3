// This file seeds the database with encrypted messages for the game

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rounds:rounds123@aiodysseyrounds.rr88p.mongodb.net/?retryWrites=true&w=majority&appName=AIODYSSEYRounds';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the EncryptedMessage schema for this script
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
    enum: ['caesar', 'base64', 'morse', 'binary', 'reverse', 'mixed', 'rot13', 'atbash', 'hex', 'md5'],
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
    default: true
  }
});

// Create model
const EncryptedMessage = mongoose.models.EncryptedMessage || 
  mongoose.model('EncryptedMessage', EncryptedMessageSchema);

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

// Seed the database
async function seedDatabase() {
  try {
    // Clear existing data
    await EncryptedMessage.deleteMany({});
    console.log('Cleared existing encrypted messages');
    
    // Insert into database
    await EncryptedMessage.insertMany(messages);
    console.log(`Added ${messages.length} encrypted messages to the database`);
    
    // Set the first one as active
    if (messages.length > 0) {
      await EncryptedMessage.updateMany({}, { active: false });
      await EncryptedMessage.findOneAndUpdate(
        { encryptionType: "caesar", originalText: "This is a test" }, 
        { active: true }
      );
      console.log('Set the first message as active');
    }
    
    console.log('Database seeding completed');
    
    // Exit the process after seeding
    mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedDatabase(); 