import React, { useState, useEffect } from 'react';
import ChatRoom from './components/ChatRoom';
import LoginForm from './components/LoginForm';
import UserProfile from './components/UserProfile';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('chatapp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('chatapp_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (userData) => {
    const userWithDefaults = {
      ...userData,
      username: userData.username || 'User',
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username || 'User')}&background=random`,
      email: userData.email || '',
      id: userData.id || Date.now().toString()
    };
    localStorage.setItem('chatapp_user', JSON.stringify(userWithDefaults));
    setUser(userWithDefaults);
  };

  const handleLogout = () => {
    localStorage.removeItem('chatapp_user');
    setUser(null);
  };

  const handleUpdateUser = (updatedUser) => {
    const userWithDefaults = {
      ...user,
      ...updatedUser,
      username: updatedUser.username || user.username,
      avatar: updatedUser.avatar || user.avatar
    };
    localStorage.setItem('chatapp_user', JSON.stringify(userWithDefaults));
    setUser(userWithDefaults);
  };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('chatapp_theme', newMode ? 'dark' : 'light');
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <LoginForm onLogin={handleLogin} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/10 sticky top-6">
                <UserProfile 
                  user={user} 
                  onLogout={handleLogout}
                  onUpdate={handleUpdateUser}
                  onToggleDarkMode={handleToggleDarkMode}
                  darkMode={darkMode}
                />
                
                {/* Additional sidebar content can go here */}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <ChatRoom 
                user={user} 
                onLogout={handleLogout} 
                darkMode={darkMode}

              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;