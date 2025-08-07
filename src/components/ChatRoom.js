import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import Header from './Header';
import TypingIndicator from './TypingIndicator';
import ScreenShare from './ScreenShare';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { useMediaQuery } from '@mui/material';

const SOCKET_URL = 'https://chatapp-uly9.onrender.com';

export default function ChatRoom({ user, onLogout, darkMode, onToggleDarkMode }) {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [bg, setBg] = useState(() => localStorage.getItem('chatapp_bg') || 'blue');
  const [customBg] = useState(() => localStorage.getItem('chatapp_custom_bg') || null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [privateChatUser, setPrivateChatUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [showUserListMobile, setShowUserListMobile] = useState(false);
  const prevUsersRef = useRef([]);
  const socketRef = useRef(null);
  const [bgColor] = useState(() => localStorage.getItem('bubblytalk_bg_color') || '#f8fafc');

  useEffect(() => {
    localStorage.setItem('chatapp_bg', bg);
    // If user picks a color, override bg
    if (bgColor) {
      document.body.style.background = bgColor;
    }
  }, [bg, bgColor]);

  useEffect(() => {
    if (bg !== 'custom') return;
    if (!customBg) setBg('blue');
  }, [bg, customBg]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    // Join with user info
    socket.emit('user_join', {
      username: user.username,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.username}`,
    });

    // Listen for new messages
    socket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for message history
    socket.on('message_history', (history) => {
      setMessages(history);
    });

    // Listen for user list updates
    socket.on('user_list', (userList) => {
      // Detect status changes for notifications
      const prevUsers = prevUsersRef.current;
      userList.forEach(u => {
        if (u.username === user.username) return; // skip self
        const prev = prevUsers.find(pu => pu.id === u.id);
        if (prev && prev.status !== u.status) {
          if (u.status === 'offline') {
            setSnackbar({ open: true, message: `${u.username} is now away`, severity: 'warning' });
          } else if (u.status === 'online') {
            setSnackbar({ open: true, message: `${u.username} is back online`, severity: 'success' });
          }
        }
      });
      prevUsersRef.current = userList;
      setUsers(userList);
    });

    // Listen for typing events
    socket.on('user_typing', (typingUser) => setTypingUser(typingUser));
    socket.on('user_stop_typing', () => setTypingUser(null));

    // Private message receive
    socket.on('private_message', (msg) => {
      setPrivateMessages((prev) => {
        // Only add if for this user
        if (
          (privateChatUser && msg.from.id === privateChatUser.id) ||
          (privateChatUser && msg.to.id === privateChatUser.id)
        ) {
          return [...prev, msg];
        } else {
          // Unread badge
          return prev;
        }
      });
    });
    // Private history receive
    socket.on('private_history', ({ withId, history }) => {
      if (privateChatUser && privateChatUser.id === withId) {
        setPrivateMessages(history);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, privateChatUser]);

  useEffect(() => {
    return () => {
      document.body.style.background = '';
    };
  }, [bgColor]);

  const sendMessage = (msg) => {
    if (socketRef.current) {
      if (typeof msg === 'string') {
        socketRef.current.emit('send_message', { content: msg });
      } else {
        // msg is an object with file/image data
        socketRef.current.emit('send_message', msg);
      }
    }
  };

  // Typing indicator logic
  const handleTypingStart = () => {
    if (socketRef.current) socketRef.current.emit('typing_start');
  };
  const handleTypingStop = () => {
    if (socketRef.current) socketRef.current.emit('typing_stop');
  };

  // Start private chat
  const handleUserClick = (u) => {
    if (u.id === socketRef.current.id) return; // Don't chat with self
    setPrivateChatUser(u);
    setPrivateMessages([]);
    // Request history
    socketRef.current.emit('get_private_history', { withId: u.id });
  };
  // Send private message
  const sendPrivateMessage = (msg) => {
    if (!privateChatUser) return;
    if (typeof msg === 'string') {
      socketRef.current.emit('private_message', { to: privateChatUser.id, content: msg });
    } else {
      // For now, only support text in private chat
      socketRef.current.emit('private_message', { to: privateChatUser.id, content: msg.content || '' });
    }
  };

  return (
    <div className={`flex flex-col h-screen relative overflow-hidden`}
      style={{ background: bgColor }}>
      <Header onLogout={onLogout} darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} user={user} />
      {/* Mobile user list toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 rounded-full p-2 shadow-lg border focus:outline-none"
        aria-label="Show online users"
        onClick={() => setShowUserListMobile(true)}
        style={{ display: showUserListMobile ? 'none' : 'block' }}
      >
        <MenuIcon />
      </button>
      {/* Animated background selector as a floating circle button */}
      {/* (Color picker circle removed as requested) */}
      <div className="flex flex-1 min-h-0 transition-colors duration-500">
        {/* UserList sidebar: always visible on md+, toggle on mobile */}
        <div>
          <div
            className={`fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden transition-opacity duration-300 ${showUserListMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setShowUserListMobile(false)}
            aria-label="Close user list overlay"
          />
          <aside
            className={`z-40 md:static md:translate-x-0 fixed top-0 left-0 h-full transition-transform duration-300 md:block ${showUserListMobile ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            style={{ width: '14rem' }}
          >
            <div className="md:hidden flex justify-end p-2">
              <button
                className="bg-white dark:bg-gray-800 rounded-full p-1 shadow border border-gray-200 dark:border-gray-700"
                aria-label="Hide online users"
                onClick={() => setShowUserListMobile(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <UserList users={users} onUserClick={handleUserClick} selectedUserId={privateChatUser?.id} />
          </aside>
        </div>
        <main className="flex flex-col flex-1 min-h-0 m-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 shadow-2xl p-4 backdrop-blur-md border border-gray-200 dark:border-gray-800">
          {privateChatUser ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg shadow">
                <div className="flex items-center gap-2">
                  <img src={privateChatUser.avatar} alt={privateChatUser.username} className="w-8 h-8 rounded-full border" />
                  <span className="font-semibold text-blue-700 dark:text-blue-200">{privateChatUser.username}</span>
                </div>
                <button onClick={() => setPrivateChatUser(null)} className="ml-2 p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800">
                  <CloseIcon />
                </button>
              </div>
              <MessageList messages={privateMessages} user={user} />
              <MessageInput onSendMessage={sendPrivateMessage} />
            </div>
          ) : (
            <>
              <ScreenShare user={user} />
              <MessageList messages={messages} user={user} />
              {typingUser && typingUser.username !== user.username && <TypingIndicator user={typingUser} />}
              <MessageInput onSendMessage={sendMessage} onTypingStart={handleTypingStart} onTypingStop={handleTypingStop} />
            </>
          )}
        </main>
      </div>
      {/* Snackbar for user status notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Animated background keyframes */}
      <style>{`
        @keyframes bg-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bg-gradient {
          background-size: 200% 200%;
          animation: bg-gradient 12s ease-in-out infinite;
        }
        @keyframes bg-fade {
          0%,100%{filter:brightness(1);} 50%{filter:brightness(1.08);}
        }
        .animate-bg-fade { animation: bg-fade 6s ease-in-out infinite; }
        @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
        .animate-fadeIn { animation: fadeIn 1.2s both; }
        @keyframes pop { 0%{transform:scale(0.9);} 60%{transform:scale(1.05);} 100%{transform:scale(1);} }
        .animate-pop { animation: pop 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
