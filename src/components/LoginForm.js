import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUser, FaImage, FaCameraRetro, FaRandom, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=random';

const avatarOptions = [
  { id: 'male', name: 'Male', url: 'https://xsgames.co/randomusers/avatar.php?g=male' },
  { id: 'female', name: 'Female', url: 'https://xsgames.co/randomusers/avatar.php?g=female' },
  { id: 'pixel', name: 'Pixel', url: 'https://xsgames.co/randomusers/avatar.php?g=pixel' },
  { id: 'identicon', name: 'Identicon', url: 'https://xsgames.co/randomusers/avatar.php?g=identicon' },
];

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  // Handle avatar selection
  const handleAvatarSelect = (avatarUrl) => {
    setAvatar(avatarUrl);
    setSelectedAvatar(avatarUrl);
  };

  // Generate random avatar
  const handleRandomAvatar = () => {
    const randomAvatar = `https://xsgames.co/randomusers/avatar.php?g=any&random=${Math.floor(Math.random() * 1000)}`;
    setAvatar(randomAvatar);
    setSelectedAvatar(randomAvatar);
  };

  // Dropzone for custom avatar upload
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target.result);
        setSelectedAvatar('custom');
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'image/gif': [] 
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    const userData = {
      id: Date.now().toString(),
      username: username.trim(),
      email: email.trim(),
      avatar: avatar || defaultAvatar,
      status: 'online',
      lastSeen: new Date().toISOString()
    };

    onLogin(userData);
  };

  // Load saved user data if exists
  useEffect(() => {
    const saved = localStorage.getItem('chatapp_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.username) {
          setUsername(user.username);
          setEmail(user.email || '');
          setAvatar(user.avatar || defaultAvatar);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }, []);

  // Toggle between login and signup modes
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'login' ? 'signup' : 'login');
  };

  const [touched, setTouched] = useState(false);
  const isSignup = mode === 'signup';
  const isValid = username.trim().length > 2;
  // Removed color picker functionality as it's not needed

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
          </h1>
          <p className="text-blue-100 mt-1">
            {mode === 'login' ? 'Sign in to continue' : 'Join our community today'}
          </p>
        </div>

        {/* Main Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <div
                {...getRootProps()}
                className={`relative w-24 h-24 rounded-full border-4 ${isDragActive ? 'border-yellow-400' : 'border-blue-400'} mb-4 overflow-hidden cursor-pointer group`}
              >
                <input {...getInputProps()} />
                {avatar ? (
                  <img
                    src={avatar}
                    alt={username || 'User'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatar;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <FaImage className="text-gray-400 text-2xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaCameraRetro className="text-white text-xl" />
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">Choose an avatar</p>
                <div className="flex justify-center gap-2 mb-3">
                  {avatarOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleAvatarSelect(option.url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 ${selectedAvatar === option.url ? 'border-blue-500' : 'border-transparent'}`}
                      title={option.name}
                    >
                      <img 
                        src={option.url} 
                        alt={option.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultAvatar;
                        }}
                      />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                    title="Random"
                  >
                    <FaRandom className="text-xs" />
                  </button>
                </div>
                {isDragActive ? (
                  <p className="text-xs text-blue-600">Drop your image here</p>
                ) : (
                  <p className="text-xs text-gray-500">Or drag & drop your photo</p>
                )}
              </div>
            </div>

            {/* Username Field */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setTouched(true);
                  }}
                  placeholder="Enter your username"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={3}
                />
              </div>
              {touched && username.length < 3 && (
                <p className="mt-1 text-sm text-red-600">Username must be at least 3 characters</p>
              )}
            </div>

            {/* Email Field (only for signup) */}
            {mode === 'signup' && (
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isValid}
            >
              {mode === 'login' ? (
                <>
                  <FaSignInAlt />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <FaUserPlus />
                  <span>Create Account</span>
                </>
              )}
            </button>

            {/* Toggle between login/signup */}
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </span>
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}