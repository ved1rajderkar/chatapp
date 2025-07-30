import React, { useState, useCallback } from 'react';
import { FaUser, FaImage, FaTimes, FaSmile } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=random';

export default function ProfileModal({ open, onClose, user, onUpdate }) {
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || defaultAvatar);

  // Dropzone for avatar upload
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => setAvatar(e.target.result);
      reader.readAsDataURL(file);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'image/gif': [] } });

  const handleSave = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    const updatedUser = { username: username.trim(), avatar: avatar || defaultAvatar };
    localStorage.setItem('chatapp_user', JSON.stringify(updatedUser));
    onUpdate(updatedUser);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-xl focus:outline-none"
          aria-label="Close"
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-center gap-2">
          <FaSmile className="text-pink-500 animate-bounce" />
          Edit Profile
        </h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Avatar upload */}
          <div {...getRootProps()} className="flex flex-col items-center cursor-pointer group">
            <input {...getInputProps()} accept="image/*,image/gif" />
            <div className="w-20 h-20 rounded-full border-4 border-blue-400 dark:border-purple-500 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition">
              {avatar ? (
                <img src={avatar} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <FaImage className="text-4xl text-gray-400 animate-pulse" />
              )}
            </div>
            <span className="text-xs text-gray-500 mt-1">{isDragActive ? 'Drop image or GIF here...' : 'Click or drag to upload avatar (JPG, PNG, GIF)'}</span>
          </div>
          {/* Username input */}
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="pl-10 pr-3 rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 w-full"
            />
          </div>
          <button
            type="submit"
            disabled={!username.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2 rounded-md shadow hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
} 