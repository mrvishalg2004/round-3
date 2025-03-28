// Encryption utility functions

// Caesar Cipher encryption
export function caesarCipher(text: string, shift: number = 3): string {
  return text
    .split('')
    .map(char => {
      // Check if the character is a letter
      if (/[a-zA-Z]/.test(char)) {
        // Get ASCII code
        const code = char.charCodeAt(0);
        // Determine the base ASCII code (65 for uppercase, 97 for lowercase)
        const base = code < 91 ? 65 : 97;
        // Apply shift and wrap around alphabet (26 letters)
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      // Return non-alphabetic characters unchanged
      return char;
    })
    .join('');
}

// Base64 Encoding
export function base64Encode(text: string): string {
  if (typeof window !== 'undefined') {
    // Browser environment
    return btoa(text);
  } else {
    // Node.js environment
    return Buffer.from(text).toString('base64');
  }
}

// Morse Code conversion
export function textToMorse(text: string): string {
  const morseCodeMap: { [key: string]: string } = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 
    'Y': '-.--', 'Z': '--..', 
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', 
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', 
    ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..'
  };

  return text
    .toUpperCase()
    .split('')
    .map(char => morseCodeMap[char] || char)
    .join(' ');
}

// Binary conversion
export function textToBinary(text: string): string {
  return text
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');
}

// Reverse String
export function reverseString(text: string): string {
  return text.split('').reverse().join('');
}

// Mixed encryption (combines multiple methods)
export function mixedEncryption(text: string): { encryptedText: string, methods: string[] } {
  // Randomly select 2-3 encryption methods
  const encryptionMethods = [
    'caesar', 'base64', 'morse', 'binary', 'reverse'
  ];
  
  // Shuffle array and pick 2-3 methods
  const shuffled = [...encryptionMethods].sort(() => 0.5 - Math.random());
  const numMethods = Math.floor(Math.random() * 2) + 2; // 2-3 methods
  const selectedMethods = shuffled.slice(0, numMethods);
  
  // Apply each method in sequence
  let processedText = text;
  selectedMethods.forEach(method => {
    switch (method) {
      case 'caesar':
        processedText = caesarCipher(processedText, 3);
        break;
      case 'base64':
        processedText = base64Encode(processedText);
        break;
      case 'morse':
        processedText = textToMorse(processedText);
        break;
      case 'binary':
        processedText = textToBinary(processedText);
        break;
      case 'reverse':
        processedText = reverseString(processedText);
        break;
    }
  });
  
  return { encryptedText: processedText, methods: selectedMethods };
}

// Generate a hint based on the encryption method
export function generateHint(encryptionType: string, methods?: string[]): string {
  const hints: { [key: string]: string[] } = {
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
    ],
    'mixed': [
      'Multiple encryption techniques have been applied to this message.',
      'You'll need to decode this message in layers.',
      'This is an onion of encryption - peel back one layer at a time.'
    ]
  };
  
  if (encryptionType === 'mixed' && methods && methods.length > 0) {
    // Provide a hint about which methods were used
    const methodsText = methods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
    return `This message uses multiple encryption techniques: ${methodsText}. Decrypt them in reverse order.`;
  }
  
  // Randomly select a hint for the given encryption type
  const typeHints = hints[encryptionType] || hints['mixed'];
  return typeHints[Math.floor(Math.random() * typeHints.length)];
} 