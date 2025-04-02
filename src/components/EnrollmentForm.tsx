import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { checkNetlifySocketServer, isNetlifyEnvironment } from '@/utils/netlifySocket';

interface EnrollmentFormProps {
  onEnroll: (teamName: string, email: string) => void;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onEnroll }) => {
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  // Check server status on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Use Netlify-specific check if on Netlify
        if (isNetlifyEnvironment()) {
          const isServerAvailable = await checkNetlifySocketServer();
          setServerStatus(isServerAvailable ? 'online' : 'offline');
          return;
        }
        
        // Standard check for local development
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
        const response = await fetch(`${socketUrl}/api/socketio`);
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (err) {
        console.error('Server status check failed:', err);
        setServerStatus('offline');
      }
    };
    
    checkServerStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check server status before proceeding
    if (serverStatus === 'offline') {
      setError('Game server appears to be offline. Please try again later or contact the administrator.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      onEnroll(teamName, email);
    } catch (err: any) {
      setError(err.message || 'Failed to enroll. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Join the Decryption Challenge</h2>
      
      {serverStatus === 'offline' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Warning:</strong>
          <span className="block"> Game server appears to be offline. You may experience connection issues.</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="teamName" className="block text-gray-700 font-medium mb-2">Team Name</label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your team name"
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email address"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Joining...' : 'Join Challenge'}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Already enrolled? Your session will be automatically restored if you're using the same browser.</p>
      </div>

      {isNetlifyEnvironment() && (
        <div className="mt-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Notice: </strong>
          <span className="block sm:inline">
            This game is running on Netlify, which has limited support for real-time features. 
            The game will function with some limitations, including less frequent updates and possible delays in receiving game status changes.
          </span>
        </div>
      )}
    </div>
  );
};

export default EnrollmentForm; 