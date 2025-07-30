import React from 'react';

export default function TypingIndicator({ user }) {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-300 px-4 py-1 animate-pulse">
      <span className="font-medium">{user.username}</span>
      <span className="relative flex items-center">
        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0ms' }}></span>
        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '100ms' }}></span>
        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
      </span>
      <span>is typing...</span>
    </div>
  );
} 