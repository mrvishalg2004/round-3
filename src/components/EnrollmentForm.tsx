import React, { useState } from 'react';

interface EnrollmentFormProps {
  onEnroll: (teamName: string, email: string) => void;
}

const EnrollmentForm: React.FC<EnrollmentFormProps> = ({ onEnroll }) => {
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{teamName?: string; email?: string}>({});

  const validateForm = () => {
    const newErrors: {teamName?: string; email?: string} = {};
    
    if (!teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onEnroll(teamName, email);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Join the Decryption Challenge</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            type="text"
            id="teamName"
            className={`w-full p-2 border rounded-md ${errors.teamName ? 'border-red-500' : 'border-gray-300'}`}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          {errors.teamName && <p className="mt-1 text-sm text-red-500">{errors.teamName}</p>}
        </div>
        
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
          <div className="flex">
            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-800">
                By joining, you're entering a decryption challenge where you'll need to solve encrypted messages. Ready to test your skills?
              </p>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Join Challenge
        </button>
      </form>
    </div>
  );
};

export default EnrollmentForm; 