import React, { useState, useEffect } from 'react';

interface DecryptionSubmissionFormProps {
  onSubmit: (submittedText: string) => void;
  isSubmitting: boolean;
  result: any;
  onRefresh?: () => void;
}

const DecryptionSubmissionForm: React.FC<DecryptionSubmissionFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  result,
  onRefresh
}) => {
  const [submittedText, setSubmittedText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ message: string; type: 'success' | 'error' | '' }>({
    message: '',
    type: ''
  });
  const [showCelebration, setShowCelebration] = useState(false);

  // Clear feedback after longer time for success (15 seconds) and shorter for errors (5 seconds)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (feedbackMessage.message) {
      const duration = feedbackMessage.type === 'success' ? 15000 : 5000;
      timeout = setTimeout(() => {
        setFeedbackMessage({ message: '', type: '' });
        if (feedbackMessage.type === 'success') {
          setShowCelebration(false);
        }
      }, duration);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [feedbackMessage]);

  // Set feedback when result changes
  useEffect(() => {
    if (result) {
      console.log('Submission result received:', result);
      
      // Only show celebration for correct answers
      if (result.success === true) {
        setShowCelebration(true);
        setFeedbackMessage({
          message: `🏆 CONGRATULATIONS! 🏆`,
          type: 'success'
        });
        
        // Clear the input for correct answers
        setSubmittedText('');
      } else {
        // Turn off celebrations for incorrect answers
        setShowCelebration(false);
        setFeedbackMessage({
          message: result.message || 'Incorrect answer. Try again!',
          type: 'error'
        });
      }
    }
  }, [result]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submittedText.trim()) {
      setFeedbackMessage({
        message: 'Please enter your decrypted message',
        type: 'error'
      });
      return;
    }
    
    onSubmit(submittedText);
  };

  // More impressive party animation components
  const PartyEmojis = () => {
    const emojis = ['🎉', '🎊', '🥳', '🎈', '🎇', '🎆', '👏', '🎯', '🏆', '🔥', '⭐', '✨', '💯', '💪'];
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {emojis.map((emoji, index) => (
          <div 
            key={index}
            className="absolute animate-float text-5xl"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
              transform: `rotate(${Math.random() * 360}deg) scale(${0.7 + Math.random() * 0.6})`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>
    );
  };
  
  // Enhanced Confetti effect
  const Confetti = () => {
    const particles = Array(120).fill(null); // Doubled the particles
    const colors = ['#FF5252', '#FFD740', '#00C853', '#40C4FF', '#651FFF', '#FF4081', '#FFEB3B', '#2962FF', '#00BFA5'];
    
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map((_, index) => {
          const color = colors[Math.floor(Math.random() * colors.length)];
          const isSquare = Math.random() > 0.5;
          return (
            <div 
              key={index}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: color,
                width: isSquare ? `${5 + Math.random() * 7}px` : `${3 + Math.random() * 5}px`,
                height: isSquare ? `${5 + Math.random() * 7}px` : `${10 + Math.random() * 15}px`,
                opacity: Math.random(),
                borderRadius: isSquare ? '0' : '50%',
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${5 + Math.random() * 7}s`,
              }}
            />
          );
        })}
      </div>
    );
  };
  
  // New Fireworks component
  const Fireworks = () => {
    const fireworks = Array(15).fill(null);
    
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        {fireworks.map((_, index) => {
          const left = `${10 + Math.random() * 80}%`;
          const top = `${20 + Math.random() * 50}%`;
          const size = 80 + Math.random() * 120;
          const delay = Math.random() * 4;
          
          return (
            <div 
              key={index}
              className="absolute animate-firework"
              style={{
                left,
                top,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    );
  };

  // Add spinning stars for more celebration
  const SpinningStars = () => {
    const stars = Array(20).fill(null);
    
    return (
      <div className="fixed inset-0 pointer-events-none z-5">
        {stars.map((_, index) => (
          <div
            key={index}
            className="absolute animate-spin-slow text-yellow-400 opacity-80"
            style={{
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
              fontSize: `${20 + Math.random() * 30}px`,
              animationDuration: `${2 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            ★
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6 relative">
      {showCelebration && <PartyEmojis />}
      {showCelebration && <Confetti />}
      {showCelebration && <Fireworks />}
      {showCelebration && <SpinningStars />}
      
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Submit Your Answer:</h3>
      
      {feedbackMessage.message && (
        <div className={`mb-6 p-5 rounded-lg shadow-lg transition-all duration-300 ${
          feedbackMessage.type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white transform scale-110' 
            : 'bg-red-100 text-red-800 border-2 border-red-400'
        }`}>
          {feedbackMessage.type === 'success' ? (
            <div className="flex flex-col items-center py-4">
              <div className="text-4xl font-bold mb-4 tracking-wide text-center text-white drop-shadow-lg animate-pulse">{feedbackMessage.message}</div>
              <div className="text-2xl mb-3 font-semibold text-center">
                {result?.message || "🎉 You've successfully decrypted the message! 🎉"}
              </div>
              <div className="text-xl font-medium text-center max-w-md mx-auto text-white opacity-90">
                Your cryptographic skills are impressive. Ready for the next challenge?
              </div>
              <div className="mt-6 flex justify-center space-x-3">
                {['🎉', '🏆', '🥳', '🔥', '⭐', '👑'].map((emoji, i) => (
                  <span key={i} className="animate-bounce text-5xl inline-block" style={{ 
                    animationDelay: `${0.1 * i}s`,
                    animationDuration: `${0.8 + Math.random() * 0.6}s` 
                  }}>
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="font-medium text-lg mb-2">
                {feedbackMessage.message}
              </div>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="decryption" className="block text-base font-medium text-gray-800 mb-2">
            Your Decrypted Message:
          </label>
          <textarea
            id="decryption"
            className="w-full p-4 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-lg"
            rows={4}
            value={submittedText}
            onChange={(e) => setSubmittedText(e.target.value)}
            placeholder="Enter your decrypted message here..."
            disabled={isSubmitting}
          ></textarea>
          <p className="mt-2 text-base text-gray-700">
            Decrypt the message using any tools or techniques you need. Case doesn't matter.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !submittedText.trim()}
          className={`w-full py-4 px-4 font-bold text-lg rounded-md transition ${
            isSubmitting || !submittedText.trim()
              ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block mr-2 animate-spin">⟳</span>
              Submitting...
            </>
          ) : (
            'Submit Answer'
          )}
        </button>
      </form>
      
      {/* Add styles for the animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0) scale(1); }
          25% { transform: translate(10px, -20px) rotate(5deg) scale(1.05); }
          50% { transform: translate(20px, 0px) rotate(10deg) scale(1.1); }
          75% { transform: translate(10px, 20px) rotate(5deg) scale(1.05); }
          100% { transform: translate(0, 0) rotate(0) scale(1); }
        }
        
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        @keyframes firework {
          0% { transform: scale(0); box-shadow: 0 0 0 0 transparent; opacity: 1; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); box-shadow: 0 0 0 100px transparent; opacity: 0; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-confetti {
          animation: confetti 6s ease-in-out forwards;
        }
        
        .animate-firework {
          animation: firework 1.5s ease-out forwards;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        }
        
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DecryptionSubmissionForm; 