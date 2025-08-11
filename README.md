# ChatApp - Real-time Chat Application

A beautiful, WhatsApp-like real-time chat application built with Node.js, Express, Socket.IO, and Firebase. Features user authentication, real-time messaging, and persistent chat history.

## 🚀 Features

### Authentication
- **Email/Password Sign Up & Sign In**: Secure user registration and login
- **Google OAuth**: One-click sign-in with Google accounts
- **User Profile Management**: Store user data with profile pictures
- **Session Management**: Automatic login state persistence

### Real-time Chat
- **Instant Messaging**: Real-time message delivery using Socket.IO
- **Typing Indicators**: See when other users are typing
- **Online Status**: Real-time online/offline user status
- **Message History**: Persistent chat history stored in Firebase Firestore
- **System Messages**: Welcome and user join/leave notifications

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful, WhatsApp-inspired interface
- **Dark/Light Theme**: Toggle between themes
- **Emoji Support**: Built-in emoji picker
- **User Sidebar**: Display online users and chat participants
- **Settings Modal**: User preferences and account management

### Advanced Features
- **Auto-scroll**: Messages automatically scroll to bottom
- **Message Timestamps**: Display message sending times
- **Notification Sounds**: Audio feedback for new messages
- **Message Validation**: Prevent empty messages
- **XSS Protection**: Secure message rendering
- **Error Handling**: Comprehensive error messages and loading states

## 🛠️ Technologies Used

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **CORS**: Cross-origin resource sharing

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Client-side functionality
- **Font Awesome**: Icon library

### Database & Services
- **Firebase Authentication**: User authentication service
- **Firebase Firestore**: NoSQL cloud database
- **Firebase Analytics**: Usage analytics

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Firebase Project** (for authentication and database)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password and Google providers)
   - Enable Firestore Database
   - Get your Firebase configuration from Project Settings
   - Update the configuration in `public/firebase-config.js`

4. **Start the application**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3000`
   - Sign up or sign in to start chatting

## 🔧 Firebase Configuration

Your Firebase configuration should be placed in `public/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

### Required Firebase Services

1. **Authentication**
   - Enable Email/Password authentication
   - Enable Google authentication
   - Configure authorized domains

2. **Firestore Database**
   - Create a database in test mode
   - Set up security rules for user data
   - Create collections: `users`, `messages`

## 📁 Project Structure

```
chat-app/
├── public/
│   ├── index.html          # Authentication page
│   ├── chat.html           # Main chat interface
│   ├── styles.css          # All styling
│   ├── auth.js             # Authentication logic
│   ├── chat.js             # Chat functionality
│   ├── firebase-config.js  # Firebase configuration
│   └── socket.io.js        # Socket.IO client (CDN)
├── server.js               # Express server & Socket.IO
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables (optional)
└── README.md              # This file
```

## 🎯 Usage

### For Users

1. **Sign Up/Sign In**
   - Visit the application homepage
   - Choose between email/password or Google sign-in
   - Complete the authentication process

2. **Start Chatting**
   - After authentication, you'll be redirected to the chat room
   - See other online users in the sidebar
   - Type messages in the input field
   - Use emojis with the emoji picker
   - Toggle themes in settings

3. **Features**
   - Real-time message updates
   - Typing indicators
   - Online user status
   - Message history persistence
   - Responsive design for all devices

### For Developers

1. **Development Mode**
   ```bash
   npm run dev
   ```
   - Uses nodemon for auto-restart on file changes
   - Better for development and debugging

2. **Production Mode**
   ```bash
   npm start
   ```
   - Standard Node.js execution
   - Optimized for production deployment

3. **Customization**
   - Modify `public/styles.css` for styling changes
   - Update `public/chat.js` for chat functionality
   - Edit `server.js` for server-side logic
   - Configure Firebase settings as needed

## 🔒 Security Features

- **Input Validation**: All user inputs are validated
- **XSS Protection**: Messages are escaped to prevent XSS attacks
- **Authentication**: Secure user authentication with Firebase
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Error Handling**: Comprehensive error handling and user feedback

## 🌐 Browser Support

- **Chrome** (recommended)
- **Firefox**
- **Safari**
- **Edge**
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set up environment variables
2. Configure Firebase production settings
3. Deploy to your preferred hosting service
4. Update Firebase security rules for production

### Recommended Hosting Platforms
- **Heroku**
- **Vercel**
- **Netlify**
- **Railway**
- **DigitalOcean**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify Firebase configuration
3. Ensure all dependencies are installed
4. Check network connectivity
5. Review Firebase security rules

## 🔮 Future Enhancements

- **File Sharing**: Upload and share images, documents
- **Voice Messages**: Record and send voice messages
- **Video Calls**: Real-time video calling
- **Group Chats**: Create and manage group conversations
- **Message Reactions**: React to messages with emojis
- **Message Search**: Search through chat history
- **Push Notifications**: Browser notifications for new messages
- **Message Encryption**: End-to-end encryption
- **User Profiles**: Detailed user profiles and status
- **Message Editing**: Edit sent messages
- **Message Deletion**: Delete messages
- **Read Receipts**: See when messages are read

## 📊 Performance

- **Real-time Updates**: < 100ms message delivery
- **Responsive Design**: Works on all screen sizes
- **Optimized Loading**: Fast initial page load
- **Efficient Database**: Optimized Firestore queries
- **Minimal Dependencies**: Lightweight application

---

**Built with ❤️ using Node.js, Express, Socket.IO, and Firebase** 