import React, { useState } from 'react';

interface HeaderProps {
  teamName?: string;
}

const Header: React.FC<HeaderProps> = ({ teamName }) => {
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  
  return (
    <header className="bg-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">
            <span className="mr-2">🔐</span>
            Decryption Challenge
          </h1>
          
          <button 
            onClick={() => setShowSecurityInfo(!showSecurityInfo)}
            className="ml-4 text-xs bg-indigo-800 hover:bg-indigo-900 px-2 py-1 rounded flex items-center"
            aria-label="Security information"
          >
            <span className="mr-1">🔒</span>
            Security Info
          </button>
        </div>
        
        {teamName && (
          <div className="flex items-center">
            <div className="bg-indigo-800 rounded-full px-4 py-1 flex items-center">
              <span className="mr-2">👥</span>
              <span className="font-semibold">{teamName}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Security information panel */}
      {showSecurityInfo && (
        <div className="container mx-auto px-4 pb-4">
          <div className="bg-indigo-800 p-4 rounded-md text-sm">
            <h3 className="font-bold mb-2 text-lg">Security Requirements</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>This game must be played in fullscreen mode</li>
              <li>Exiting fullscreen or switching tabs more than 3 times will disqualify your team</li>
              <li>Do not attempt to use keyboard shortcuts (F11, ESC, Alt+Tab, etc.)</li>
              <li>Do not attempt to open developer tools</li>
              <li>Screenshots are not allowed during the game</li>
            </ul>
            <p className="mt-3 text-indigo-300 italic">
              These measures ensure fair gameplay for all participants.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 