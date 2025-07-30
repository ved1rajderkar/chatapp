import React from 'react';

export default function UserList({ users, onUserClick, selectedUserId }) {
  return (
    <aside className="w-56 bg-white border-r p-4 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Online Users</h2>
      <ul className="space-y-3">
        {users.map(user => (
          <li
            key={user.id}
            className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 transition-colors ${selectedUserId === user.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => onUserClick && onUserClick(user)}
          >
            <div className="relative">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                alt={user.username}
                className="w-8 h-8 rounded-full border"
              />
              {/* Online/offline status dot */}
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            </div>
            <span>{user.username}</span>
            {user.status === 'offline' && (
              <span className="ml-1 text-xs text-gray-400">(away)</span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
} 