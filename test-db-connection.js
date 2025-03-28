const mongoose = require('mongoose');

// MongoDB connection string - same as in db.ts with the corrected format
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rounds:rounds123@aiodysseyrounds.rr88p.mongodb.net/?retryWrites=true&w=majority&appName=AIODYSSEYRounds';

async function testDbConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');

    // Define a simple schema matching our encrypted message
    const EncryptedMessageSchema = new mongoose.Schema({
      originalText: String,
      encryptedText: String,
      encryptionType: String,
      hint: String,
      difficulty: String,
      active: Boolean
    });

    // Create a model
    const EncryptedMessage = mongoose.models.EncryptedMessage || 
      mongoose.model('EncryptedMessage', EncryptedMessageSchema);

    // Count total messages
    const totalMessages = await EncryptedMessage.countDocuments();
    console.log(`Total encrypted messages in database: ${totalMessages}`);

    // Check for active messages
    const activeMessage = await EncryptedMessage.findOne({ active: true });
    console.log('Active message found:', activeMessage ? 'Yes' : 'No');

    if (activeMessage) {
      console.log('Active message details:');
      console.log('- Original text:', activeMessage.originalText);
      console.log('- Encrypted text:', activeMessage.encryptedText);
      console.log('- Hint:', activeMessage.hint);
      console.log('- Encryption type:', activeMessage.encryptionType);
      console.log('- Difficulty:', activeMessage.difficulty);
    } else if (totalMessages > 0) {
      console.log('No active message found, but messages exist. Setting first one as active...');
      const firstMessage = await EncryptedMessage.findOne();
      firstMessage.active = true;
      await firstMessage.save();
      console.log('First message activated successfully');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
}

// Run the test
testDbConnection(); 