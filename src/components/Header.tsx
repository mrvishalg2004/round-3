import React from 'react';

interface HeaderProps {
  teamName?: string;
}

const Header: React.FC<HeaderProps> = ({ teamName }) => {
  return (
    <header className="bg-indigo-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">
            <span className="mr-2">🔐</span>
            Decryption Challenge
          </h1>
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
    </header>
  );
};

export default Header; 