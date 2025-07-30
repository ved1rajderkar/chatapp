const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Store connected users
const connectedUsers = new Map();
const userActivity = new Map(); // socket.id -> last activity timestamp
const OFFLINE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in ms
const messages = [];

// Store private messages: { userPairKey: [messages] }
const privateMessages = new Map(); // key: sorted user id pair, value: array of messages

// Helper: get user pair key
function getUserPairKey(id1, id2) {
  return [id1, id2].sort().join(':');
}

// Helper: find message by id
function findMessageById(id) {
  return messages.find(m => m.id === id);
}

// Helper: update user activity
function updateUserActivity(socketId) {
  userActivity.set(socketId, Date.now());
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('user_join', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}&background=random`,
      status: 'online', // add status
    };
    
    connectedUsers.set(socket.id, user);
    updateUserActivity(socket.id);
    
    // Broadcast user joined message
    const joinMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: `${user.username} joined the chat`,
      timestamp: new Date().toISOString(),
      user: user
    };
    
    messages.push(joinMessage);
    io.emit('message', joinMessage);
    io.emit('user_list', Array.from(connectedUsers.values()));
    
    // Send existing messages to new user
    socket.emit('message_history', messages);
  });

  // Handle new message
  socket.on('send_message', (messageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    updateUserActivity(socket.id);

    let message;
    if (messageData.type === 'image' || messageData.type === 'file') {
      message = {
        id: Date.now().toString(),
        type: messageData.type,
        content: messageData.content,
        fileName: messageData.fileName,
        fileType: messageData.fileType,
        fileData: messageData.fileData,
        timestamp: new Date().toISOString(),
        user: user,
        reactions: {}, // emoji: [usernames]
      };
    } else {
      message = {
        id: Date.now().toString(),
        type: 'message',
        content: messageData.content,
        timestamp: new Date().toISOString(),
        user: user,
        reactions: {},
      };
    }

    messages.push(message);
    io.emit('message', message);
  });

  // Handle reactions
  socket.on('react_message', ({ messageId, emoji }) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    const msg = findMessageById(messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
    const idx = msg.reactions[emoji].indexOf(user.username);
    if (idx === -1) {
      // Add reaction
      msg.reactions[emoji].push(user.username);
    } else {
      // Remove reaction
      msg.reactions[emoji].splice(idx, 1);
    }
    io.emit('message', msg); // Broadcast updated message
  });

  // Handle typing indicator
  socket.on('typing_start', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      updateUserActivity(socket.id);
      socket.broadcast.emit('user_typing', user);
    }
  });

  socket.on('typing_stop', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      updateUserActivity(socket.id);
      socket.broadcast.emit('user_stop_typing', user);
    }
  });

  // WebRTC signaling relay
  socket.on('signal', ({ to, from, data }) => {
    updateUserActivity(socket.id);
    if (to === 'all') {
      // Broadcast to all except sender
      socket.broadcast.emit('signal', { from, data });
    } else if (to && data) {
      io.to(to).emit('signal', { from, data });
    }
  });

  // Handle screen share upcoming notification
  socket.on('screen_share_upcoming', ({ username }) => {
    // Broadcast to all except sender
    socket.broadcast.emit('screen_share_upcoming', { username });
  });

  // Handle private messages
  socket.on('private_message', ({ to, content }) => {
    const fromUser = connectedUsers.get(socket.id);
    const toUser = connectedUsers.get(to);
    if (!fromUser || !toUser) return;
    const msg = {
      id: Date.now().toString(),
      type: 'private',
      content,
      timestamp: new Date().toISOString(),
      from: { id: socket.id, username: fromUser.username, avatar: fromUser.avatar },
      to: { id: to, username: toUser.username, avatar: toUser.avatar },
    };
    // Store in memory
    const key = getUserPairKey(socket.id, to);
    if (!privateMessages.has(key)) privateMessages.set(key, []);
    privateMessages.get(key).push(msg);
    // Send to both sender and recipient
    io.to(socket.id).emit('private_message', msg);
    io.to(to).emit('private_message', msg);
  });

  // Handle request for private message history
  socket.on('get_private_history', ({ withId }) => {
    const key = getUserPairKey(socket.id, withId);
    const history = privateMessages.get(key) || [];
    socket.emit('private_history', { withId, history });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      userActivity.delete(socket.id);
      
      const leaveMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `${user.username} left the chat`,
        timestamp: new Date().toISOString(),
        user: user
      };
      
      messages.push(leaveMessage);
      io.emit('message', leaveMessage);
      io.emit('user_list', Array.from(connectedUsers.values()));
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Inactivity checker: runs every minute
setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [socketId, user] of connectedUsers.entries()) {
    const lastActive = userActivity.get(socketId) || 0;
    if (user.status !== 'offline' && now - lastActive > OFFLINE_TIMEOUT) {
      user.status = 'offline';
      changed = true;
    } else if (user.status === 'offline' && now - lastActive <= OFFLINE_TIMEOUT) {
      user.status = 'online';
      changed = true;
    }
  }
  if (changed) {
    io.emit('user_list', Array.from(connectedUsers.values()));
  }
}, 60 * 1000); // every minute

// API Routes
app.get('/api/users', (req, res) => {
  res.json(Array.from(connectedUsers.values()));
});

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// API endpoint to send invite emails
app.post('/api/invite', async (req, res) => {
  const { to, link } = req.body;
  if (!to || !link) return res.status(400).json({ error: 'Missing to or link' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: 'You are invited to join the chat app!',
      html: `<p>You have been invited to join the chat app. Click <a href="${link}">here</a> to join!</p>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Invite email error:', err);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 