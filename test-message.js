// Test script to validate hardcoded messages

// Define hardcoded messages directly in the test script since we can't import the TypeScript module
const hardcodedMessages = {
  "message-1": {
    id: "message-1",
    originalText: "This is a test",
    encryptedText: "Wklv lv d whvw",
    encryptionType: "caesar",
    hint: "😂 Funny Hint: \"Imagine your keyboard got drunk and shifted every letter three places forward.\"",
    difficulty: "easy"
  },
  "message-2": {
    id: "message-2",
    originalText: "Hi",
    encryptedText: "01001000 01101001",
    encryptionType: "binary",
    hint: "😂 Funny Hint: \"Robots use this language. You see 0s and 1s, but they see words.\"",
    difficulty: "medium"
  },
  "message-3": {
    id: "message-3",
    originalText: "Something secret",
    encryptedText: "U29tZXRoaW5nIHNlY3JldA==",
    encryptionType: "base64",
    hint: "😂 Funny Hint: \"This message took a vacation and got sunburned in Base64.\"",
    difficulty: "medium"
  }
};

console.log('Testing hardcoded messages:');
console.log(`Total messages: ${Object.keys(hardcodedMessages).length}`);

// Validate the first message
const firstMessage = hardcodedMessages['message-1'];
console.log('\nFirst message:');
console.log('ID:', firstMessage.id);
console.log('Original text:', firstMessage.originalText);
console.log('Encrypted text:', firstMessage.encryptedText);
console.log('Encryption type:', firstMessage.encryptionType);
console.log('Hint:', firstMessage.hint);
console.log('Difficulty:', firstMessage.difficulty);

// Simulate a solution check
function checkSolution(messageId, solution) {
  const message = hardcodedMessages[messageId];
  if (!message) {
    console.log(`Message with ID ${messageId} not found`);
    return false;
  }
  
  const submittedSolution = solution.trim().toLowerCase();
  const originalText = message.originalText.trim().toLowerCase();
  const isCorrect = submittedSolution === originalText;
  
  console.log(`\nChecking solution for message ${messageId}:`);
  console.log(`Original text: "${originalText}"`);
  console.log(`Submitted solution: "${submittedSolution}"`);
  console.log(`Result: ${isCorrect ? 'Correct! ✅' : 'Incorrect! ❌'}`);
  
  return isCorrect;
}

// Test some solutions
checkSolution('message-1', 'This is a test'); // Should be correct
checkSolution('message-1', 'This is a wrong answer'); // Should be incorrect
checkSolution('message-2', 'Hi'); // Should be correct
checkSolution('message-3', 'Something secret'); // Should be correct 