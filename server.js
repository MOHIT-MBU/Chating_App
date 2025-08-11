const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and their conversations
const connectedUsers = new Map();
const userConversations = new Map(); // Store user's conversations

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining
  socket.on('userJoined', (userData) => {
    connectedUsers.set(socket.id, userData);
    socket.broadcast.emit('userJoined', userData);
    io.emit('userList', Array.from(connectedUsers.values()));
    
    // Initialize user's conversations
    if (!userConversations.has(userData.id)) {
      userConversations.set(userData.id, new Set());
    }
  });

  // Handle new message (group chat)
  socket.on('sendMessage', async (messageData) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const messageWithUser = {
        ...messageData,
        userId: socket.id,
        userName: user.name,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        type: 'group'
      };
      
      // Check if this is a file message
      if (messageData.fileURL) {
        messageWithUser.isFileMessage = true;
        messageWithUser.fileType = messageData.fileType;
        messageWithUser.fileSize = messageData.fileSize;
        messageWithUser.fileName = messageData.fileName;
        console.log('File message received:', messageData.fileName);
      }
      
      // Store in Firebase
      try {
        const { initializeApp } = require('firebase/app');
        const { getFirestore, collection, addDoc } = require('firebase/firestore');
        
        // Initialize Firebase only once
        if (!global.firebaseApp) {
          const firebaseConfig = {
            apiKey: "AIzaSyDc1mX065SM1nAJijqjEKfcq8aB4G_usD4",
            authDomain: "chatapp-9cd86.firebaseapp.com",
            projectId: "chatapp-9cd86",
            storageBucket: "chatapp-9cd86.firebasestorage.app",
            messagingSenderId: "817317249530",
            appId: "1:817317249530:web:339229e9c1e1d894302443",
            measurementId: "G-B2S711R6SB"
          };
          
          global.firebaseApp = initializeApp(firebaseConfig);
          global.firebaseDb = getFirestore(global.firebaseApp);
        }
        
        await addDoc(collection(global.firebaseDb, 'messages'), messageWithUser);
        console.log('Message stored in Firebase');
      } catch (error) {
        console.error('Error storing message in Firebase:', error);
      }
      
      io.emit('newMessage', messageWithUser);
    }
  });

  // Handle personal message
  socket.on('sendPersonalMessage', async (messageData) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const personalMessage = {
        ...messageData,
        fromUserId: user.id,
        fromUserName: user.name,
        fromUserEmail: user.email,
        timestamp: new Date().toISOString(),
        type: 'personal',
        conversationKey: [user.id, messageData.toUserId].sort().join('_')
      };

      // Check if this is a file message
      if (messageData.fileURL) {
        personalMessage.isFileMessage = true;
        personalMessage.fileType = messageData.fileType;
        personalMessage.fileSize = messageData.fileSize;
        personalMessage.fileName = messageData.fileName;
        console.log('Personal file message received:', messageData.fileName);
      }

      // Store in Firebase
      try {
        const { initializeApp } = require('firebase/app');
        const { getFirestore, collection, addDoc } = require('firebase/firestore');
        
        // Initialize Firebase only once
        if (!global.firebaseApp) {
          const firebaseConfig = {
            apiKey: "AIzaSyDc1mX065SM1nAJijqjEKfcq8aB4G_usD4",
            authDomain: "chatapp-9cd86.firebaseapp.com",
            projectId: "chatapp-9cd86",
            storageBucket: "chatapp-9cd86.firebasestorage.app",
            messagingSenderId: "817317249530",
            appId: "1:817317249530:web:339229e9c1e1d894302443",
            measurementId: "G-B2S711R6SB"
          };
          
          global.firebaseApp = initializeApp(firebaseConfig);
          global.firebaseDb = getFirestore(global.firebaseApp);
        }
        
        await addDoc(collection(global.firebaseDb, 'personal_messages'), personalMessage);
        console.log('Personal message stored in Firebase');
      } catch (error) {
        console.error('Error storing personal message in Firebase:', error);
      }

      // Send to recipient
      const recipientSocket = findSocketByUserId(messageData.toUserId);
      if (recipientSocket) {
        recipientSocket.emit('newPersonalMessage', personalMessage);
      }
      
      // Send back to sender (for confirmation)
      socket.emit('newPersonalMessage', personalMessage);
      
      // Store conversation for both users
      storeConversation(user.id, messageData.toUserId, personalMessage);
    }
  });

  // Handle typing
  socket.on('typing', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('userTyping', {
        userId: socket.id,
        userName: user.name,
        isTyping: data.isTyping
      });
    }
  });

  // Handle personal typing
  socket.on('personalTyping', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const recipientSocket = findSocketByUserId(data.toUserId);
      if (recipientSocket) {
        recipientSocket.emit('personalTyping', {
          fromUserId: user.id,
          fromUserName: user.name,
          isTyping: data.isTyping
        });
      }
    }
  });

  // Handle user requesting conversations
  socket.on('getConversations', (userId) => {
    const conversations = userConversations.get(userId) || new Set();
    socket.emit('conversationsList', Array.from(conversations));
  });

  // Handle user requesting specific conversation
  socket.on('getConversation', (data) => {
    const { userId1, userId2 } = data;
    const conversationKey = getConversationKey(userId1, userId2);
    const conversation = getConversation(userId1, userId2);
    socket.emit('conversationHistory', {
      conversationKey,
      messages: conversation
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);
      socket.broadcast.emit('userLeft', user);
      io.emit('userList', Array.from(connectedUsers.values()));
    }
    console.log('User disconnected:', socket.id);
  });
});

// Helper functions
function findSocketByUserId(userId) {
  for (const [socketId, userData] of connectedUsers.entries()) {
    if (userData.id === userId) {
      return io.sockets.sockets.get(socketId);
    }
  }
  return null;
}

function getConversationKey(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
}

function storeConversation(userId1, userId2, message) {
  const conversationKey = getConversationKey(userId1, userId2);
  
  // Store for both users
  if (!userConversations.has(userId1)) {
    userConversations.set(userId1, new Set());
  }
  if (!userConversations.has(userId2)) {
    userConversations.set(userId2, new Set());
  }
  
  userConversations.get(userId1).add(conversationKey);
  userConversations.get(userId2).add(conversationKey);
}

function getConversation(userId1, userId2) {
  // This would typically fetch from database
  // For now, return empty array (implement with Firebase)
  return [];
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 