import mongoose from 'mongoose';

// Define the schema for the encrypted message
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
  },
  // Add a field to track which teams this message is active for
  activeForTeams: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Add a pre-save hook to ensure activeForTeams is initialized
EncryptedMessageSchema.pre('save', function(next) {
  if (!this.activeForTeams) {
    this.activeForTeams = [];
  }
  next();
});

// Check if model exists before creating it
export default mongoose.models.EncryptedMessage || 
  mongoose.model('EncryptedMessage', EncryptedMessageSchema); 