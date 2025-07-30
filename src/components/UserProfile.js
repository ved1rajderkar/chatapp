import React, { useState } from 'react';
import { FaUser, FaPencilAlt, FaSignOutAlt, FaMoon, FaSun } from 'react-icons/fa';
import ProfileModal from './ProfileModal';

export default function UserProfile({ user, onLogout, onToggleDarkMode, darkMode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || 'Guest',
    avatar: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=random',
    email: user?.email || '',
    status: 'online',
    lastSeen: 'Just now'
  });

  const handleUpdateProfile = (updatedData) => {
    setProfileData(prev => ({
      ...prev,
      ...updatedData,
      username: updatedData.username || prev.username,
      avatar: updatedData.avatar || prev.avatar
    }));
    // Here you would typically update the user in your backend
    localStorage.setItem('chatapp_user', JSON.stringify({
      ...user,
      username: updatedData.username || user.username,
      avatar: updatedData.avatar || user.avatar
    }));
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
      <div className="relative group">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400">
          <img 
            src={profileData.avatar} 
            alt={profileData.username}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.username)}&background=random`;
            }}
          />
        </div>
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-transform hover:scale-110"
          title="Edit Profile"
        >
          <FaPencilAlt className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{profileData.username}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span className={`w-2 h-2 rounded-full ${profileData.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          <span>{profileData.status}</span>
          <span>•</span>
          <span className="truncate">{profileData.email || 'No email'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleDarkMode}
          className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
        </button>
        <button 
          onClick={onLogout}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          title="Sign Out"
        >
          <FaSignOutAlt className="w-5 h-5" />
        </button>
      </div>

      <ProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={profileData}
        onUpdate={handleUpdateProfile}
      />
    </div>
  );
}
