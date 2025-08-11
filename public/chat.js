// Enhanced Chat Application - JavaScript
// Modern, feature-rich real-time chat with beautiful UI

// Global variables and state management
let socket;
let currentUser = null;
let typingTimeout;
let isTyping = false;
let currentChatMode = 'group'; // 'group' or 'personal'
let selectedUser = null;
let personalConversations = new Map();
let messageHistory = new Map();
let isOnline = true;
let soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
let notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';

// Enhanced constants
const CONFIG = {
    MAX_MESSAGE_LENGTH: 1000,
    TYPING_TIMEOUT: 1000,
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 2000,
    MESSAGE_BATCH_SIZE: 50,
    SCROLL_THRESHOLD: 100,
    NOTIFICATION_TIMEOUT: 5000
};

// Enhanced utility functions
const Utils = {
    // Debounce function for performance optimization
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Enhanced HTML escaping
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    // Format timestamp with enhanced options
    formatTimestamp(timestamp, options = {}) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (options.relative && diffMs < 60000) {
            return 'Just now';
        } else if (options.relative && diffMins < 60) {
            return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        } else if (options.relative && diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (options.relative && diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }

        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            ...(options.showSeconds && { second: '2-digit' })
        };
        
        const dateOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (options.includeDate || diffDays > 0) {
            return `${date.toLocaleDateString([], dateOptions)} at ${date.toLocaleTimeString([], timeOptions)}`;
        }
        
        return date.toLocaleTimeString([], timeOptions);
    },

    // Generate unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Enhanced notification support
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            localStorage.setItem('notificationPermission', permission);
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    },

    // Show browser notification
    showNotification(title, options = {}) {
        if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'chatapp-message',
            renotify: true,
            requireInteraction: false,
            ...options
        });

        // Auto-close after timeout
        setTimeout(() => notification.close(), CONFIG.NOTIFICATION_TIMEOUT);

        // Focus window when clicked
        notification.addEventListener('click', () => {
            window.focus();
            notification.close();
        });
    }
};

// Enhanced Firebase integration
async function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds timeout
        
        const checkFirebase = () => {
            attempts++;
            
            if (window.firebase && window.firebaseReady && window.firebase.db && window.firebase.auth) {
                console.log('✅ Firebase initialized successfully');
                resolve();
            } else if (attempts >= maxAttempts) {
                console.error('❌ Firebase initialization timeout');
                reject(new Error('Firebase initialization timeout'));
            } else {
                console.log(`⏳ Waiting for Firebase... (attempt ${attempts}/${maxAttempts})`);
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Enhanced loading screen
function showEnhancedLoading() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <h2>Initializing Chat...</h2>
            <p>Setting up secure connection</p>
        </div>
    `;
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    document.body.appendChild(loadingOverlay);
}

// Enhanced initialization
async function initializeChatApp() {
    try {
        showEnhancedLoading();
        
        // Wait for Firebase with timeout
        try {
            await waitForFirebase();
        } catch (firebaseError) {
            console.error('Firebase initialization failed:', firebaseError);
            showErrorMessage('Database connection failed. Please check your internet connection and refresh the page.');
            return;
        }
        
        // Check authentication with enhanced error handling
        firebase.onAuthStateChanged(firebase.auth, async (user) => {
            if (user) {
                currentUser = user;
                try {
                    await initializeChat();
                } catch (chatError) {
                    console.error('Chat initialization failed:', chatError);
                    showErrorMessage('Failed to load chat. Please refresh the page.');
                }
            } else {
                console.warn('User not authenticated, redirecting to login...');
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            }
        });
    } catch (error) {
        console.error('Error initializing chat app:', error);
        showErrorMessage('Failed to initialize chat. Please refresh the page.');
    }
}

// Enhanced chat initialization
async function initializeChat() {
    try {
        // Get enhanced user data from Firestore
        const userDoc = await firebase.getDoc(firebase.doc(firebase.db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            currentUser = { 
                ...currentUser, 
                ...userData,
                lastSeen: firebase.serverTimestamp(),
                isOnline: true
            };
        }
        
        // Initialize enhanced Socket.IO
        await initializeSocket();
        
        // Set up enhanced event listeners
        setupEventListeners();
        
        // Initialize UI components
        initializeUI();
        
        // Load chat history with pagination
        await loadChatHistory();
        
        // Set up real-time presence
        setupPresenceSystem();
        
        // Initialize notifications
        await Utils.requestNotificationPermission();
        
        // Set default chat mode
        switchToGroupChat();
        
        // Hide loading overlay
        setTimeout(() => {
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Error initializing chat:', error);
        showErrorMessage('Failed to load chat. Please try refreshing the page.');
    }
}

// Enhanced socket initialization with reconnection logic
async function initializeSocket() {
    return new Promise((resolve, reject) => {
        try {
            socket = io({
                transports: ['websocket', 'polling'],
                upgrade: true,
                timeout: 20000,
                forceNew: true
            });

            // Enhanced connection event handlers
            socket.on('connect', () => {
                console.log('✅ Connected to server');
                isOnline = true;
                updateConnectionStatus(true);
                
                // Join with enhanced user data
                socket.emit('userJoined', {
                    id: currentUser.uid,
                    name: currentUser.displayName || currentUser.name || currentUser.email,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    joinedAt: Date.now(),
                    device: getDeviceInfo()
                });
                
                resolve();
            });

            socket.on('disconnect', (reason) => {
                console.warn('❌ Disconnected from server:', reason);
                isOnline = false;
                updateConnectionStatus(false);
                
                if (reason === 'io server disconnect') {
                    // Server initiated disconnect, try to reconnect
                    socket.connect();
                }
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Connection error:', error);
                updateConnectionStatus(false);
            });

            // Enhanced message handlers
            socket.on('newMessage', (message) => {
                if (currentChatMode === 'group') {
                    displayMessage(message);
                    playNotificationSound();
                    
                    // Show browser notification if not focused
                    if (document.hidden && message.userId !== currentUser.uid) {
                        Utils.showNotification(`New message from ${message.userName}`, {
                            body: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : ''),
                            icon: message.userPhoto || '/favicon.ico'
                        });
                    }
                }
            });

            socket.on('newPersonalMessage', (message) => {
                if (currentChatMode === 'personal') {
                    displayPersonalMessage(message);
                    playNotificationSound();
                    
                    if (document.hidden) {
                        Utils.showNotification(`Personal message from ${message.fromUserName}`, {
                            body: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : '')
                        });
                    }
                }
            });

            // Enhanced user events
            socket.on('userJoined', (user) => {
                if (currentChatMode === 'group' && user.id !== currentUser.uid) {
                    displaySystemMessage(`${user.name} joined the chat`, 'user-joined');
                }
                updateOnlineCount();
                updateUsersList();
            });

            socket.on('userLeft', (user) => {
                if (currentChatMode === 'group' && user.id !== currentUser.uid) {
                    displaySystemMessage(`${user.name} left the chat`, 'user-left');
                }
                updateOnlineCount();
                updateUsersList();
            });

            // Enhanced typing indicators
            socket.on('userTyping', (data) => {
                handleTypingIndicator(data, 'group');
            });

            socket.on('personalTyping', (data) => {
                handleTypingIndicator(data, 'personal');
            });

            // Enhanced user list updates
            socket.on('userList', (users) => {
                updateUsersList(users);
                updateOnlineCount(users.length);
            });

            // Error handling
            socket.on('error', (error) => {
                console.error('Socket error:', error);
                showErrorMessage('Connection error. Please check your internet connection.');
            });

            // Reconnection events
            socket.on('reconnect', (attemptNumber) => {
                console.log(`✅ Reconnected after ${attemptNumber} attempts`);
                showSuccessMessage('Reconnected to chat server');
            });

            socket.on('reconnect_error', (error) => {
                console.error('Reconnection failed:', error);
                showErrorMessage('Failed to reconnect. Please refresh the page.');
            });

        } catch (error) {
            console.error('Socket initialization error:', error);
            reject(error);
        }
    });
}

// Enhanced event listeners setup
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (messageInput) {
        // Enhanced input handlers with debouncing
        messageInput.addEventListener('input', Utils.debounce(handleInputChange, 300));
        messageInput.addEventListener('keydown', handleKeyDown);
        messageInput.addEventListener('paste', handlePaste);
        messageInput.addEventListener('focus', handleInputFocus);
        messageInput.addEventListener('blur', handleInputBlur);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Enhanced scroll handling for message container
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.addEventListener('scroll', Utils.throttle(handleScroll, 100));
    }

    // Enhanced window event listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Online/offline detection
    window.addEventListener('online', () => {
        isOnline = true;
        updateConnectionStatus(true);
        showSuccessMessage('Connection restored');
        if (socket && !socket.connected) {
            socket.connect();
        }
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        updateConnectionStatus(false);
        showErrorMessage('Connection lost');
    });
}

// Enhanced UI initialization
function initializeUI() {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeButton('dark');
    }

    // Initialize notification settings
    updateNotificationButton(notificationsEnabled);
    updateSoundButton(soundsEnabled);

    // Initialize character counter
    updateCharacterCount(0);

    // Add intersection observer for message loading
    setupIntersectionObserver();

    // Initialize accessibility features
    setupAccessibility();
}

// Enhanced message sending with validation and retry logic
async function sendMessage() {
    if (!socket || !socket.connected) {
        showErrorMessage('Not connected to server. Please wait...');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) return;

    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showErrorMessage(`Message too long. Maximum ${CONFIG.MAX_MESSAGE_LENGTH} characters allowed.`);
        return;
    }

    try {
        // Disable send button temporarily
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        const messageData = {
            text: message,
            timestamp: Date.now(),
            id: Utils.generateMessageId(),
            edited: false,
            reactions: {}
        };

        if (currentChatMode === 'group') {
            socket.emit('sendMessage', messageData);
        } else if (currentChatMode === 'personal' && selectedUser) {
            socket.emit('sendPersonalMessage', {
                ...messageData,
                toUserId: selectedUser.id
            });
        }

        // Clear input and reset UI
        messageInput.value = '';
        autoResize(messageInput);
        updateCharacterCount(0);
        hideTypingIndicator();

        // Re-enable send button
        setTimeout(() => {
            sendBtn.disabled = false;
        }, 500);

    } catch (error) {
        console.error('Error sending message:', error);
        showErrorMessage('Failed to send message. Please try again.');
        
        // Re-enable send button
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = false;
    }
}

// Enhanced typing handler with improved performance
const handleInputChange = () => {
    const messageInput = document.getElementById('messageInput');
    const length = messageInput.value.length;
    
    updateCharacterCount(length);
    updateSendButton(length > 0);
    autoResize(messageInput);
    handleTyping();
};

// Enhanced typing indicator logic
function handleTyping() {
    if (!socket || !socket.connected) return;

    if (isTyping) {
        clearTimeout(typingTimeout);
    } else {
        isTyping = true;
        emitTyping(true);
    }

    typingTimeout = setTimeout(() => {
        isTyping = false;
        emitTyping(false);
    }, CONFIG.TYPING_TIMEOUT);
}

function emitTyping(typing) {
    if (!socket) return;

    if (currentChatMode === 'group') {
        socket.emit('typing', { isTyping: typing });
    } else if (currentChatMode === 'personal' && selectedUser) {
        socket.emit('personalTyping', { 
            isTyping: typing, 
            toUserId: selectedUser.id 
        });
    }
}

// Enhanced message display with animations and accessibility
function displayMessage(message) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    const isOwnMessage = message.userId === currentUser.uid;
    
    messageDiv.className = `message ${isOwnMessage ? 'own-message' : 'other-message'}`;
    messageDiv.setAttribute('data-message-id', message.id);
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', `Message from ${message.userName}`);
    
    const time = Utils.formatTimestamp(message.timestamp, { relative: false });
    const relativeTime = Utils.formatTimestamp(message.timestamp, { relative: true });
    
    // Check if this is a file message
    let messageContent = Utils.escapeHtml(message.text);
    if (message.fileURL && message.isFileMessage) {
        const fileSize = message.fileSize ? `(${(message.fileSize / 1024 / 1024).toFixed(2)} MB)` : '';
        const fileType = message.fileType || 'image';
        
        if (fileType.startsWith('image/')) {
            messageContent = `
                <div class="file-message">
                    <div class="file-info">
                        <i class="fas fa-image" aria-hidden="true"></i>
                        <span class="file-name">${Utils.escapeHtml(message.fileName || 'Image')}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    <div class="file-preview">
                        <img src="${message.fileURL}" alt="${Utils.escapeHtml(message.fileName || 'Image')}" 
                             onclick="openImageModal('${message.fileURL}', '${Utils.escapeHtml(message.fileName || 'Image')}')"
                             class="file-image" loading="lazy">
                    </div>
                </div>
            `;
        } else {
            messageContent = `
                <div class="file-message">
                    <div class="file-info">
                        <i class="fas fa-file" aria-hidden="true"></i>
                        <span class="file-name">${Utils.escapeHtml(message.fileName || 'File')}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    <div class="file-actions">
                        <button onclick="downloadFile('${message.fileURL}', '${Utils.escapeHtml(message.fileName || 'file')}')" 
                                class="download-btn">
                            <i class="fas fa-download" aria-hidden="true"></i>
                            Download
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${message.userPhoto 
                ? `<img src="${message.userPhoto}" alt="${message.userName}" onerror="this.style.display='none'">`
                : `<i class="fas fa-user" aria-hidden="true"></i>`
            }
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${Utils.escapeHtml(message.userName)}</span>
                <span class="message-time" title="${time}">${relativeTime}</span>
            </div>
            <div class="message-text">${messageContent}</div>
            <div class="message-status">
                ${isOwnMessage ? '<i class="fas fa-check message-delivered" aria-label="Delivered"></i>' : ''}
            </div>
        </div>
    `;
    
    // Add message with animation
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom if user is near the bottom
    if (!message.isFromHistory && shouldScrollToBottom()) {
        scrollToBottom();
    }
    
    // Update last message timestamp
    updateLastMessageTime(message.timestamp);
    
    // Add to message history for search functionality
    messageHistory.set(message.id, message);
}

// Enhanced personal message display
function displayPersonalMessage(message) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    const isOwnMessage = message.fromUserId === currentUser.uid;
    
    messageDiv.className = `message personal ${isOwnMessage ? 'own-message' : 'other-message'}`;
    messageDiv.setAttribute('data-message-id', message.id);
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', `Personal message from ${message.fromUserName}`);
    
    const time = Utils.formatTimestamp(message.timestamp);
    
    // Check if this is a file message
    let messageContent = Utils.escapeHtml(message.text);
    if (message.fileURL && message.isFileMessage) {
        const fileSize = message.fileSize ? `(${(message.fileSize / 1024 / 1024).toFixed(2)} MB)` : '';
        const fileType = message.fileType || 'image';
        
        if (fileType.startsWith('image/')) {
            messageContent = `
                <div class="file-message">
                    <div class="file-info">
                        <i class="fas fa-image" aria-hidden="true"></i>
                        <span class="file-name">${Utils.escapeHtml(message.fileName || 'Image')}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    <div class="file-preview">
                        <img src="${message.fileURL}" alt="${Utils.escapeHtml(message.fileName || 'Image')}" 
                             onclick="openImageModal('${message.fileURL}', '${Utils.escapeHtml(message.fileName || 'Image')}')"
                             class="file-image" loading="lazy">
                    </div>
                </div>
            `;
        } else {
            messageContent = `
                <div class="file-message">
                    <div class="file-info">
                        <i class="fas fa-file" aria-hidden="true"></i>
                        <span class="file-name">${Utils.escapeHtml(message.fileName || 'File')}</span>
                        <span class="file-size">${fileSize}</span>
                    </div>
                    <div class="file-actions">
                        <button onclick="downloadFile('${message.fileURL}', '${Utils.escapeHtml(message.fileName || 'file')}')" 
                                class="download-btn">
                            <i class="fas fa-download" aria-hidden="true"></i>
                            Download
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${message.fromUserPhoto 
                ? `<img src="${message.fromUserPhoto}" alt="${message.fromUserName}">`
                : `<i class="fas fa-user" aria-hidden="true"></i>`
            }
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-sender">${Utils.escapeHtml(message.fromUserName)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${messageContent}</div>
            <div class="message-status">
                ${isOwnMessage ? '<i class="fas fa-check message-delivered" aria-label="Delivered"></i>' : ''}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    if (!message.isFromHistory && shouldScrollToBottom()) {
        scrollToBottom();
    }
    
    // Store in personal conversation history
    const conversationKey = getConversationKey(currentUser.uid, selectedUser.id);
    if (!personalConversations.has(conversationKey)) {
        personalConversations.set(conversationKey, []);
    }
    personalConversations.get(conversationKey).push(message);
}

// Enhanced system message display with icons
function displaySystemMessage(text, type = 'default') {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `system-message system-${type}`;
    messageDiv.setAttribute('role', 'status');
    messageDiv.setAttribute('aria-live', 'polite');
    
    const icons = {
        'user-joined': 'fas fa-user-plus',
        'user-left': 'fas fa-user-minus',
        'error': 'fas fa-exclamation-triangle',
        'success': 'fas fa-check-circle',
        'info': 'fas fa-info-circle',
        'default': 'fas fa-info'
    };
    
    messageDiv.innerHTML = `
        <i class="${icons[type] || icons.default}" aria-hidden="true"></i>
        <span>${Utils.escapeHtml(text)}</span>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // Auto-remove after delay for non-critical messages
    if (['user-joined', 'user-left'].includes(type)) {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = '0';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 10000);
    }
}

// Enhanced typing indicator handling
function handleTypingIndicator(data, mode) {
    const currentMode = (mode === 'group' && currentChatMode === 'group') ||
                       (mode === 'personal' && currentChatMode === 'personal' && 
                        selectedUser && data.fromUserId === selectedUser.id);
    
    if (!currentMode) return;
    
    if (data.isTyping && data.userId !== currentUser.uid) {
        showTypingIndicator(data.userName || data.fromUserName, data.userPhoto || data.fromUserPhoto);
    } else {
        hideTypingIndicator();
    }
}

function showTypingIndicator(userName, userPhoto) {
    const typingIndicator = document.getElementById('typingIndicator');
    const typingText = document.getElementById('typingText');
    const avatar = typingIndicator.querySelector('.typing-avatar');
    
    typingText.textContent = `${userName} is typing...`;
    
    if (userPhoto) {
        avatar.innerHTML = `<img src="${userPhoto}" alt="${userName}" onerror="this.innerHTML='<i class=\\"fas fa-user\\"></i>'">`;
    } else {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    typingIndicator.style.display = 'flex';
    if (shouldScrollToBottom()) {
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// Enhanced notification functions
function updateNotificationButton(enabled) {
    const button = document.getElementById('notification-toggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (enabled) {
        icon.className = 'fas fa-bell';
        text.textContent = 'Notifications On';
        button.classList.add('enabled');
    } else {
        icon.className = 'fas fa-bell-slash';
        text.textContent = 'Notifications Off';
        button.classList.remove('enabled');
    }
}

function toggleSounds() {
    soundsEnabled = !soundsEnabled;
    localStorage.setItem('soundsEnabled', soundsEnabled);
    updateSoundButton(soundsEnabled);
    
    if (soundsEnabled) {
        showSuccessMessage('Sounds enabled');
        playNotificationSound(); // Test sound
    } else {
        showSuccessMessage('Sounds disabled');
    }
}

function updateSoundButton(enabled) {
    const button = document.getElementById('sound-toggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (enabled) {
        icon.className = 'fas fa-volume-up';
        text.textContent = 'Sounds On';
        button.classList.add('enabled');
    } else {
        icon.className = 'fas fa-volume-mute';
        text.textContent = 'Sounds Off';
        button.classList.remove('enabled');
    }
}

function toggleNotifications() {
    notificationsEnabled = !notificationsEnabled;
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
    updateNotificationButton(notificationsEnabled);
    
    if (notificationsEnabled) {
        Utils.requestNotificationPermission().then(granted => {
            if (granted) {
                showSuccessMessage('Notifications enabled');
            } else {
                showErrorMessage('Notification permission denied');
                notificationsEnabled = false;
                localStorage.setItem('notificationsEnabled', 'false');
                updateNotificationButton(false);
            }
        });
    } else {
        showSuccessMessage('Notifications disabled');
    }
}

function toggleOnlineStatus() {
    const statusVisible = localStorage.getItem('statusVisible') !== 'false';
    const newStatus = !statusVisible;
    localStorage.setItem('statusVisible', newStatus);
    
    const button = document.getElementById('status-toggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (newStatus) {
        icon.className = 'fas fa-eye';
        text.textContent = 'Status Visible';
        button.classList.add('enabled');
        showSuccessMessage('Online status is now visible');
    } else {
        icon.className = 'fas fa-eye-slash';
        text.textContent = 'Status Hidden';
        button.classList.remove('enabled');
        showSuccessMessage('Online status is now hidden');
    }
    
    // Emit status change to server
    if (socket && socket.connected) {
        socket.emit('statusVisibilityChanged', { visible: newStatus });
    }
}

// Enhanced refresh functionality
async function refreshChatHistory() {
    try {
        console.log('🔄 Refreshing chat history...');
        
        // Add loading animation to refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            refreshBtn.disabled = true;
        }
        
        // Clear current messages
        clearMessages();
        
        // Reload appropriate chat
        if (currentChatMode === 'group') {
            await loadChatHistory();
        } else if (currentChatMode === 'personal' && selectedUser) {
            await loadPersonalConversation(selectedUser.id);
        }
        
        showSuccessMessage('Chat refreshed');
        
        // Remove loading animation
        setTimeout(() => {
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.remove('fa-spin');
                refreshBtn.disabled = false;
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error refreshing chat history:', error);
        showErrorMessage('Error refreshing chat. Please try again.');
        
        // Remove loading animation on error
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            const icon = refreshBtn.querySelector('i');
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        }
    }
}

// Enhanced logout function
async function logout() {
    try {
        // Show confirmation dialog
        if (!confirm('Are you sure you want to sign out?')) {
            return;
        }
        
        // Emit leaving event
        if (socket && socket.connected) {
            socket.emit('userLeaving', { 
                id: currentUser.uid,
                timestamp: Date.now()
            });
            socket.disconnect();
        }
        
        // Clear local storage
        localStorage.removeItem('lastChatMode');
        localStorage.removeItem('selectedUserId');
        
        // Sign out from Firebase
        await firebase.signOut(firebase.auth);
        
        showSuccessMessage('Signed out successfully');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
        
    } catch (error) {
        console.error('Error signing out:', error);
        showErrorMessage('Error signing out. Please try again.');
    }
}

// Enhanced navigation function
function goBack() {
    if (confirm('Are you sure you want to leave the chat?')) {
        // Clean up before leaving
        if (socket && socket.connected) {
            socket.emit('userLeaving', { id: currentUser.uid });
            socket.disconnect();
        }
        
        window.location.href = '/';
    }
}

// Enhanced connection status management
function updateConnectionStatus(isConnected) {
    const statusElements = document.querySelectorAll('.connection-indicator, .status-indicator');
    const statusDots = document.querySelectorAll('.status-dot, .connection-dot');
    
    statusDots.forEach(dot => {
        dot.style.backgroundColor = isConnected ? 'var(--success-500)' : 'var(--warning-500)';
    });
    
    // Update connection text
    const statusTexts = document.querySelectorAll('.connection-indicator span:last-child');
    statusTexts.forEach(text => {
        text.textContent = isConnected ? 'Connected' : 'Disconnected';
    });
    
    // Update document title
    if (!isConnected) {
        document.title = 'ChatApp - Disconnected';
    } else {
        document.title = 'ChatApp - Chat Interface';
    }
}

// Enhanced presence system
function setupPresenceSystem() {
    if (!socket || !currentUser) return;
    
    // Update presence on visibility change
    document.addEventListener('visibilitychange', () => {
        if (socket.connected) {
            socket.emit('presenceUpdate', {
                userId: currentUser.uid,
                isActive: !document.hidden,
                timestamp: Date.now()
            });
        }
    });
    
    // Heartbeat to maintain connection
    setInterval(() => {
        if (socket.connected) {
            socket.emit('heartbeat', {
                userId: currentUser.uid,
                timestamp: Date.now()
            });
        }
    }, 30000); // Every 30 seconds
}

// Enhanced accessibility setup
function setupAccessibility() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#messageInput';
    skipLink.textContent = 'Skip to message input';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--primary-600);
        color: var(--text-inverse);
        padding: 8px;
        border-radius: var(--radius-md);
        text-decoration: none;
        font-weight: 600;
        z-index: 10002;
        transition: top 0.3s ease;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
        // ESC to close modals/pickers
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            const activePicker = document.getElementById('emojiPicker');
            const activeSidebar = document.querySelector('.users-sidebar.active');
            
            if (activeModal) {
                toggleSettings();
            } else if (activePicker && activePicker.style.display !== 'none') {
                toggleEmojiPicker();
            } else if (activeSidebar) {
                toggleUsersList();
            }
        }
        
        // Ctrl/Cmd + / to focus message input
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const messageInput = document.getElementById('messageInput');
            if (messageInput) messageInput.focus();
        }
        
        // Ctrl/Cmd + K to toggle users list
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleUsersList();
        }
    });
    
    // Announce important changes to screen readers
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    document.body.appendChild(announcer);
    
    window.announceToScreenReader = (message) => {
        announcer.textContent = message;
        setTimeout(() => announcer.textContent = '', 1000);
    };
}

// Enhanced intersection observer for performance
function setupIntersectionObserver() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const options = {
        root: messagesContainer,
        rootMargin: '100px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Message is visible, could mark as read
                const messageElement = entry.target;
                const messageId = messageElement.dataset.messageId;
                
                // Mark message as read if it's not from current user
                if (messageElement.classList.contains('other-message')) {
                    markMessageAsRead(messageId);
                }
            }
        });
    }, options);
    
    // Observe messages as they're added
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && 
                    node.classList.contains('message')) {
                    observer.observe(node);
                }
            });
        });
    });
    
    mutationObserver.observe(messagesContainer, { childList: true });
}

// Enhanced utility functions
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'desktop';
    
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
        device = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
        device = 'mobile';
    }
    
    return {
        type: device,
        userAgent: ua,
        screen: {
            width: screen.width,
            height: screen.height
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
}

function markMessageAsRead(messageId) {
    // Implement read receipt functionality
    if (socket && socket.connected && messageId) {
        socket.emit('messageRead', {
            messageId: messageId,
            userId: currentUser.uid,
            timestamp: Date.now()
        });
    }
}

function markMessagesAsRead() {
    // Mark all visible messages as read
    const visibleMessages = document.querySelectorAll('.message.other-message:not(.read)');
    visibleMessages.forEach(message => {
        const messageId = message.dataset.messageId;
        if (messageId) {
            markMessageAsRead(messageId);
            message.classList.add('read');
        }
    });
}

function updateLastMessageTime(timestamp) {
    localStorage.setItem('lastMessageTime', timestamp);
}

function updateScrollButton() {
    // Show/hide scroll to bottom button based on scroll position
    const container = document.getElementById('messagesContainer');
    let scrollButton = document.getElementById('scrollToBottomBtn');
    
    if (!scrollButton) {
        // Create scroll button if it doesn't exist
        createScrollToBottomButton();
        scrollButton = document.getElementById('scrollToBottomBtn');
    }
    
    if (container && scrollButton) {
        const shouldShow = !shouldScrollToBottom() && container.scrollHeight > container.clientHeight;
        scrollButton.style.display = shouldShow ? 'flex' : 'none';
    }
}

function createScrollToBottomButton() {
    const button = document.createElement('button');
    button.id = 'scrollToBottomBtn';
    button.className = 'scroll-to-bottom-btn';
    button.innerHTML = `
        <i class="fas fa-arrow-down" aria-hidden="true"></i>
        <span class="sr-only">Scroll to bottom</span>
    `;
    button.style.cssText = `
        position: fixed;
        bottom: 150px;
        right: 30px;
        width: 48px;
        height: 48px;
        background: var(--gradient-cosmic, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
        color: white;
        border: none;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        z-index: 1000;
    `;
    
    button.addEventListener('click', () => {
        scrollToBottom();
    });
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(button);
}

// Enhanced user list management
function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    const userSelectorList = document.getElementById('userSelectorList');
    const noUsers = document.querySelector('.no-users');
    const noUsersSelector = document.querySelector('.no-users-selector');
    
    if (!users || users.length === 0) {
        if (noUsers) noUsers.style.display = 'block';
        if (noUsersSelector) noUsersSelector.style.display = 'block';
        return;
    }
    
    // Filter out current user
    const otherUsers = users.filter(user => user.id !== currentUser.uid);
    
    if (noUsers) noUsers.style.display = otherUsers.length === 0 ? 'block' : 'none';
    if (noUsersSelector) noUsersSelector.style.display = otherUsers.length === 0 ? 'block' : 'none';
    
    // Update users sidebar
    if (usersList) {
        usersList.innerHTML = '';
        otherUsers.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.setAttribute('role', 'listitem');
            userDiv.innerHTML = `
                <div class="user-avatar">
                    ${user.photoURL 
                        ? `<img src="${user.photoURL}" alt="${user.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''
                    }
                    <i class="fas fa-user" ${user.photoURL ? 'style="display: none;"' : ''}></i>
                </div>
                <div class="user-info">
                    <div class="user-name">${Utils.escapeHtml(user.name)}</div>
                    <div class="user-status">
                        <span class="status-indicator online"></span>
                        Online
                    </div>
                </div>
                <div class="user-actions">
                    <button class="chat-user-btn" onclick="startPersonalChat('${user.id}', '${Utils.escapeHtml(user.name)}')" 
                            aria-label="Start chat with ${user.name}">
                        <i class="fas fa-comment" aria-hidden="true"></i>
                    </button>
                </div>
            `;
            usersList.appendChild(userDiv);
        });
    }
    
    // Update user selector for personal chat
    if (userSelectorList) {
        userSelectorList.innerHTML = '';
        otherUsers.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-selector-item';
            userDiv.setAttribute('role', 'button');
            userDiv.setAttribute('tabindex', '0');
            userDiv.setAttribute('data-user-id', user.id);
            userDiv.onclick = () => selectUserForPersonalChat(user);
            userDiv.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectUserForPersonalChat(user);
                }
            };
            
            userDiv.innerHTML = `
                <div class="user-selector-avatar">
                    ${user.photoURL 
                        ? `<img src="${user.photoURL}" alt="${user.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                        : ''
                    }
                    <i class="fas fa-user" ${user.photoURL ? 'style="display: none;"' : ''}></i>
                </div>
                <div class="user-selector-info">
                    <div class="user-selector-name">${Utils.escapeHtml(user.name)}</div>
                    <div class="user-selector-status">
                        <span class="status-dot"></span>
                        Online
                    </div>
                </div>
            `;
            userSelectorList.appendChild(userDiv);
        });
    }
}

// Enhanced chat mode switching
function switchToGroupChat() {
    currentChatMode = 'group';
    selectedUser = null;
    
    // Update UI elements
    updateChatModeUI('group');
    
    // Hide personal chat selector
    const selector = document.getElementById('personalChatSelector');
    if (selector) selector.style.display = 'none';
    
    // Update title and clear messages
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) chatTitle.textContent = 'Group Chat';
    clearMessages();
    
    // Load group chat history
    loadChatHistory();
    
    // Update accessibility
    const groupMode = document.getElementById('groupMode');
    const personalMode = document.getElementById('personalMode');
    if (groupMode) groupMode.setAttribute('aria-selected', 'true');
    if (personalMode) personalMode.setAttribute('aria-selected', 'false');
}

function switchToPersonalChat() {
    currentChatMode = 'personal';
    
    // Update UI elements
    updateChatModeUI('personal');
    
    // Show user selector
    const selector = document.getElementById('personalChatSelector');
    if (selector) selector.style.display = 'block';
    
    // Update title and clear messages
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) chatTitle.textContent = 'Personal Chat';
    clearMessages();
    
    // Update user list
    updateUsersList();
    
    // Update accessibility
    const personalMode = document.getElementById('personalMode');
    const groupMode = document.getElementById('groupMode');
    if (personalMode) personalMode.setAttribute('aria-selected', 'true');
    if (groupMode) groupMode.setAttribute('aria-selected', 'false');
}

function updateChatModeUI(mode) {
    const groupBtn = document.getElementById('groupMode');
    const personalBtn = document.getElementById('personalMode');
    
    if (mode === 'group') {
        if (groupBtn) groupBtn.classList.add('active');
        if (personalBtn) personalBtn.classList.remove('active');
    } else {
        if (personalBtn) personalBtn.classList.add('active');
        if (groupBtn) groupBtn.classList.remove('active');
    }
}

// Enhanced personal chat user selection
function selectUserForPersonalChat(user) {
    selectedUser = user;
    
    // Update UI
    const selector = document.getElementById('personalChatSelector');
    if (selector) selector.style.display = 'none';
    
    // Update chat title
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) {
        chatTitle.innerHTML = `
            <div class="chat-with-user">
                <div class="chat-user-avatar">
                    ${user.photoURL 
                        ? `<img src="${user.photoURL}" alt="${user.name}">`
                        : `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="chat-user-info">
                    <span class="chat-user-name">Chat with ${Utils.escapeHtml(user.name)}</span>
                    <span class="chat-user-status">Online</span>
                </div>
            </div>
        `;
    }
    
    // Clear messages and load conversation
    clearMessages();
    loadPersonalConversation(user.id);
    
    // Update selected state in selector
    const userItems = document.querySelectorAll('.user-selector-item');
    userItems.forEach(item => item.classList.remove('selected'));
    
    const selectedItem = Array.from(userItems).find(item => 
        item.dataset.userId === user.id
    );
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    // Announce to screen readers
    if (window.announceToScreenReader) {
        window.announceToScreenReader(`Started personal chat with ${user.name}`);
    }
}

// Quick start personal chat from user list
function startPersonalChat(userId, userName) {
    // Switch to personal mode first
    switchToPersonalChat();
    
    // Find and select the user
    setTimeout(() => {
        const users = Array.from(document.querySelectorAll('.user-selector-item'));
        const userItem = users.find(item => 
            item.dataset.userId === userId
        );
        
        if (userItem) {
            userItem.click();
        }
    }, 100);
    
    // Close users sidebar
    toggleUsersList();
}

// Enhanced message loading with pagination
async function loadChatHistory() {
    try {
        console.log('📚 Loading chat history from Firebase...');
        showLoadingMessage('Loading chat history...');
        
        if (!firebase.db) {
            throw new Error('Firebase database not initialized');
        }
        
        const messagesRef = firebase.collection(firebase.db, 'messages');
        const q = firebase.query(
            messagesRef, 
            firebase.orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await firebase.getDocs(q);
        
        clearMessages();
        
        if (querySnapshot.empty) {
            console.log('📭 No previous messages found');
            displayWelcomeMessage();
        } else {
            console.log(`📖 Found ${querySnapshot.size} previous messages`);
            
            // Sort messages in ascending order for display
            const messages = [];
            querySnapshot.forEach((doc) => {
                const message = { id: doc.id, ...doc.data(), isFromHistory: true };
                if (message.type === 'group') {
                    messages.push(message);
                }
            });
            
            // Sort by timestamp ascending
            messages.sort((a, b) => a.timestamp - b.timestamp);
            
            // Display messages with staggered animation
            messages.forEach((message, index) => {
                setTimeout(() => {
                    displayMessage(message);
                }, index * 50);
            });
            
            setTimeout(() => {
                scrollToBottom();
                hideLoadingMessage();
            }, messages.length * 50 + 100);
        }
        
        // Set up real-time listener
        setupRealtimeListener('group');
        
    } catch (error) {
        console.error('❌ Error loading chat history:', error);
        displaySystemMessage('Error loading chat history. Please refresh the page.', 'error');
        hideLoadingMessage();
    }
}

// Enhanced personal conversation loading
async function loadPersonalConversation(otherUserId) {
    try {
        console.log('📚 Loading personal conversation from Firebase...');
        showLoadingMessage('Loading conversation...');
        
        // Check if Firebase is properly initialized
        if (!firebase || !firebase.db) {
            console.error('Firebase not initialized');
            throw new Error('Firebase database not initialized');
        }
        
        // Check if currentUser exists
        if (!currentUser || !currentUser.uid) {
            console.error('Current user not available');
            throw new Error('User not authenticated');
        }
        
        // Check if otherUserId is provided
        if (!otherUserId) {
            console.error('Other user ID not provided');
            throw new Error('Invalid user selection');
        }
        
        const conversationKey = getConversationKey(currentUser.uid, otherUserId);
        console.log('Conversation key:', conversationKey);
        
        // Create a simpler query first to test connection
        const messagesRef = firebase.collection(firebase.db, 'personal_messages');
        
        // Try a simple query first
        let q;
        try {
            q = firebase.query(
                messagesRef, 
                firebase.where('conversationKey', '==', conversationKey)
            );
        } catch (queryError) {
            console.error('Error creating query:', queryError);
            // Fallback to getting all messages and filtering client-side
            q = firebase.query(messagesRef);
        }
        
        const querySnapshot = await firebase.getDocs(q);
        
        clearMessages();
        
        if (querySnapshot.empty) {
            console.log('📭 No previous personal messages found');
            displayPersonalWelcomeMessage(selectedUser.name);
            hideLoadingMessage();
        } else {
            console.log(`📖 Found ${querySnapshot.size} previous personal messages`);
            
            const messages = [];
            querySnapshot.forEach((doc) => {
                const messageData = doc.data();
                // Filter messages by conversation key if we used fallback query
                if (!q || messageData.conversationKey === conversationKey) {
                    const message = { id: doc.id, ...messageData, isFromHistory: true };
                    messages.push(message);
                }
            });
            
            if (messages.length === 0) {
                console.log('📭 No messages for this conversation');
                displayPersonalWelcomeMessage(selectedUser.name);
                hideLoadingMessage();
                return;
            }
            
            // Sort by timestamp ascending
            messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            
            // Display with animation
            messages.forEach((message, index) => {
                setTimeout(() => {
                    displayPersonalMessage(message);
                }, index * 50);
            });
            
            setTimeout(() => {
                scrollToBottom();
                hideLoadingMessage();
            }, messages.length * 50 + 100);
        }
        
        // Set up real-time listener with error handling
        try {
            setupRealtimeListener('personal', conversationKey);
        } catch (listenerError) {
            console.error('Error setting up real-time listener:', listenerError);
            // Continue without real-time updates
        }
        
    } catch (error) {
        console.error('❌ Error loading personal conversation:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Error loading conversation. Please refresh the page.';
        
        if (error.message.includes('Firebase database not initialized')) {
            errorMessage = 'Database connection failed. Please check your internet connection and refresh.';
        } else if (error.message.includes('User not authenticated')) {
            errorMessage = 'Please sign in again to continue.';
        } else if (error.message.includes('Invalid user selection')) {
            errorMessage = 'Please select a valid user to chat with.';
        } else if (error.message.includes('permission-denied')) {
            errorMessage = 'Access denied. Please check your permissions.';
        } else if (error.message.includes('unavailable')) {
            errorMessage = 'Service temporarily unavailable. Please try again later.';
        }
        
        displaySystemMessage(errorMessage, 'error');
        hideLoadingMessage();
        
        // Show retry button
        showRetryButton();
    }
}

// Show retry button for failed operations
function showRetryButton() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const retryButton = document.createElement('div');
    retryButton.className = 'retry-button';
    retryButton.innerHTML = `
        <div class="retry-content">
            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
            <span>Something went wrong</span>
            <button onclick="retryOperation()" class="retry-btn">
                <i class="fas fa-redo" aria-hidden="true"></i>
                Try Again
            </button>
        </div>
    `;
    
    // Remove existing retry button if any
    const existingRetry = messagesContainer.querySelector('.retry-button');
    if (existingRetry) {
        existingRetry.remove();
    }
    
    messagesContainer.appendChild(retryButton);
}

// Retry operation function
function retryOperation() {
    const retryButton = document.querySelector('.retry-button');
    if (retryButton) {
        retryButton.remove();
    }
    
    // Retry based on current chat mode
    if (currentChatMode === 'personal' && selectedUser) {
        loadPersonalConversation(selectedUser.id);
    } else {
        loadChatHistory();
    }
}

// Retry file upload function
function retryFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        console.log('Retrying file upload...');
        uploadFile(fileInput.files[0]);
    } else {
        showErrorMessage('No file selected for retry');
    }
}

// Open image in modal
function openImageModal(imageUrl, imageName) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <div class="image-modal-header">
                <h3>${Utils.escapeHtml(imageName)}</h3>
                <button onclick="this.closest('.image-modal').remove()" class="close-modal">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
            <div class="image-modal-body">
                <img src="${imageUrl}" alt="${Utils.escapeHtml(imageName)}" class="modal-image">
            </div>
            <div class="image-modal-footer">
                <button onclick="downloadFile('${imageUrl}', '${Utils.escapeHtml(imageName)}')" class="download-btn">
                    <i class="fas fa-download" aria-hidden="true"></i>
                    Download
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// Download file function
function downloadFile(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Check Firebase connection status
function checkFirebaseStatus() {
    const status = {
        firebase: !!window.firebase,
        firebaseReady: !!window.firebaseReady,
        db: !!(window.firebase && window.firebase.db),
        auth: !!(window.firebase && window.firebase.auth),
        currentUser: !!currentUser,
        currentUserUid: !!(currentUser && currentUser.uid)
    };
    
    console.log('Firebase Status:', status);
    return status;
}

// Debug function to test Firebase connection
async function testFirebaseConnection() {
    try {
        console.log('Testing Firebase connection...');
        
        if (!firebase || !firebase.db) {
            throw new Error('Firebase not initialized');
        }
        
        // Try to read a test document
        const testRef = firebase.doc(firebase.db, 'test', 'connection-test');
        await firebase.getDoc(testRef);
        
        console.log('✅ Firebase connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        return false;
    }
}

// Test Firebase Storage connection
async function testFirebaseStorage() {
    try {
        console.log('Testing Firebase Storage connection...');
        
        if (!firebase || !firebase.storage) {
            throw new Error('Firebase Storage not initialized');
        }
        
        // Create a test reference
        const testRef = firebase.ref(firebase.storage, 'test/connection-test.txt');
        
        // Try to get metadata (this will fail if not authorized, but will test connection)
        try {
            await firebase.getDownloadURL(testRef);
        } catch (error) {
            // This is expected to fail, but it means the connection works
            if (error.code === 'storage/object-not-found') {
                console.log('✅ Firebase Storage connection test successful');
                return true;
            }
            throw error;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Firebase Storage connection test failed:', error);
        return false;
    }
}

// Comprehensive file upload diagnostic function
async function diagnoseFileUpload() {
    console.log('🔍 Starting file upload diagnosis...');
    
    const diagnosis = {
        firebase: false,
        storage: false,
        auth: false,
        fileInput: false,
        user: false,
        network: false
    };
    
    // Check Firebase initialization
    if (window.firebase && window.firebaseReady) {
        diagnosis.firebase = true;
        console.log('✅ Firebase initialized');
    } else {
        console.log('❌ Firebase not initialized');
    }
    
    // Check Firebase Storage
    if (window.firebase && window.firebase.storage) {
        diagnosis.storage = true;
        console.log('✅ Firebase Storage available');
    } else {
        console.log('❌ Firebase Storage not available');
    }
    
    // Check authentication
    if (window.firebase && window.firebase.auth) {
        diagnosis.auth = true;
        console.log('✅ Firebase Auth available');
    } else {
        console.log('❌ Firebase Auth not available');
    }
    
    // Check current user
    if (currentUser && currentUser.uid) {
        diagnosis.user = true;
        console.log('✅ User authenticated:', currentUser.uid);
    } else {
        console.log('❌ User not authenticated');
    }
    
    // Check file input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        diagnosis.fileInput = true;
        console.log('✅ File input element found');
    } else {
        console.log('❌ File input element not found');
    }
    
    // Test network connectivity
    try {
        const response = await fetch('https://www.google.com/favicon.ico');
        if (response.ok) {
            diagnosis.network = true;
            console.log('✅ Network connectivity OK');
        }
    } catch (error) {
        console.log('❌ Network connectivity issue:', error);
    }
    
    // Test Firebase Storage connection
    try {
        const storageTest = await testFirebaseStorage();
        if (storageTest) {
            console.log('✅ Firebase Storage connection test passed');
        } else {
            console.log('❌ Firebase Storage connection test failed');
        }
    } catch (error) {
        console.log('❌ Firebase Storage test error:', error);
    }
    
    console.log('📊 File Upload Diagnosis Results:', diagnosis);
    
    // Provide recommendations
    if (!diagnosis.firebase) {
        console.log('💡 Recommendation: Refresh the page to reinitialize Firebase');
    }
    if (!diagnosis.user) {
        console.log('💡 Recommendation: Sign in to upload files');
    }
    if (!diagnosis.fileInput) {
        console.log('💡 Recommendation: Check if the file input element exists in HTML');
    }
    if (!diagnosis.network) {
        console.log('💡 Recommendation: Check your internet connection');
    }
    
    return diagnosis;
}

// Enhanced real-time listener setup
function setupRealtimeListener(type, conversationKey = null) {
    // Clean up existing listeners
    if (window.currentListener) {
        window.currentListener();
    }
    
    try {
        let query;
        if (type === 'group') {
            const messagesRef = firebase.collection(firebase.db, 'messages');
            query = firebase.query(messagesRef, firebase.orderBy('timestamp', 'asc'));
        } else {
            const messagesRef = firebase.collection(firebase.db, 'personal_messages');
            query = firebase.query(
                messagesRef, 
                firebase.where('conversationKey', '==', conversationKey),
                firebase.orderBy('timestamp', 'asc')
            );
        }
        
        window.currentListener = firebase.onSnapshot(query, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const message = { id: change.doc.id, ...change.doc.data() };
                    
                    // Only display new messages (not from history)
                    const existingMessage = document.querySelector(`[data-message-id="${message.id}"]`);
                    if (!existingMessage) {
                        if (type === 'group' && message.type === 'group') {
                            displayMessage(message);
                        } else if (type === 'personal') {
                            displayPersonalMessage(message);
                        }
                        
                        // Play notification if not from current user
                        const isOwnMessage = type === 'group' 
                            ? message.userId === currentUser.uid
                            : message.fromUserId === currentUser.uid;
                            
                        if (!isOwnMessage) {
                            playNotificationSound();
                            
                            // Browser notification if window is not focused
                            if (document.hidden) {
                                const senderName = type === 'group' ? message.userName : message.fromUserName;
                                Utils.showNotification(`New message from ${senderName}`, {
                                    body: message.text.substring(0, 100) + (message.text.length > 100 ? '...' : '')
                                });
                            }
                        }
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error setting up real-time listener:', error);
    }
}

// Utility functions
function getConversationKey(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

function clearMessages() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    hideLoadingMessage();
}

function displayWelcomeMessage() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div class="welcome-message" id="welcomeMessage">
            <div class="welcome-content">
                <i class="fas fa-comments glow" aria-hidden="true"></i>
                <h3>Welcome to Group Chat!</h3>
                <p>Start a conversation by typing a message below.</p>
                <div class="welcome-features">
                    <div class="welcome-feature">
                        <i class="fas fa-bolt" aria-hidden="true"></i>
                        <span>Real-time messaging</span>
                    </div>
                    <div class="welcome-feature">
                        <i class="fas fa-shield-alt" aria-hidden="true"></i>
                        <span>Secure & private</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayPersonalWelcomeMessage(userName) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = `
        <div class="welcome-message personal-welcome" id="welcomeMessage">
            <div class="welcome-content">
                <i class="fas fa-user-friends glow" aria-hidden="true"></i>
                <h3>Personal Chat with ${Utils.escapeHtml(userName)}</h3>
                <p>This is the beginning of your private conversation.</p>
                <div class="welcome-features">
                    <div class="welcome-feature">
                        <i class="fas fa-lock" aria-hidden="true"></i>
                        <span>Private & secure</span>
                    </div>
                    <div class="welcome-feature">
                        <i class="fas fa-heart" aria-hidden="true"></i>
                        <span>Personal connection</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showLoadingMessage(text) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <span>${text}</span>
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
}

function hideLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// Enhanced utility functions
function updateOnlineCount(count) {
    const onlineCountElement = document.getElementById('onlineCount');
    if (onlineCountElement && typeof count === 'number') {
        onlineCountElement.textContent = `${count} online`;
    }
}

function updateCharacterCount(length) {
    const characterCount = document.getElementById('characterCount');
    if (characterCount) {
        characterCount.textContent = `${length}/${CONFIG.MAX_MESSAGE_LENGTH}`;
        
        // Color coding
        if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
            characterCount.style.color = 'var(--warning-500, #f59e0b)';
        } else if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.8) {
            characterCount.style.color = 'var(--warning-300, #fbbf24)';
        } else {
            characterCount.style.color = 'var(--text-muted, #6b7280)';
        }
    }
}

function updateSendButton(enabled) {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.disabled = !enabled;
        sendBtn.classList.toggle('enabled', enabled);
    }
}

function shouldScrollToBottom() {
    const container = document.getElementById('messagesContainer');
    if (!container) return true;
    return container.scrollTop + container.clientHeight >= container.scrollHeight - CONFIG.SCROLL_THRESHOLD;
}

function scrollToBottom(smooth = true) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    if (smooth && CSS.supports('scroll-behavior', 'smooth')) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        container.scrollTop = container.scrollHeight;
    }
}

// Enhanced input handlers
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    } else if (event.key === 'Escape') {
        // Clear input on escape
        event.target.value = '';
        autoResize(event.target);
        updateCharacterCount(0);
        updateSendButton(false);
    }
}

function handlePaste(event) {
    // Handle pasted content
    setTimeout(() => {
        const input = event.target;
        if (input.value.length > CONFIG.MAX_MESSAGE_LENGTH) {
            input.value = input.value.substring(0, CONFIG.MAX_MESSAGE_LENGTH);
            showErrorMessage(`Message truncated to ${CONFIG.MAX_MESSAGE_LENGTH} characters`);
        }
        autoResize(input);
        updateCharacterCount(input.value.length);
    }, 0);
}

function handleInputFocus() {
    // Hide welcome message when user starts typing
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.style.opacity = '0.5';
    }
}

function handleInputBlur() {
    // Show welcome message again if input is empty
    const welcomeMessage = document.getElementById('welcomeMessage');
    const messageInput = document.getElementById('messageInput');
    if (welcomeMessage && messageInput && !messageInput.value.trim()) {
        welcomeMessage.style.opacity = '1';
    }
}

function handleScroll() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    // Load more messages if scrolled to top (infinite scroll)
    if (container.scrollTop === 0) {
        // Implement load more functionality
        // loadMoreMessages();
    }
    
    // Update scroll-to-bottom button visibility
    updateScrollButton();
}

function handleWindowFocus() {
    document.title = 'ChatApp - Chat Interface';
    
    // Mark messages as read
    markMessagesAsRead();
}

function handleWindowBlur() {
    // Could be used for activity tracking
}

function handleBeforeUnload(event) {
    // Clean up before leaving
    if (socket && socket.connected) {
        socket.emit('userLeaving', { id: currentUser.uid });
    }
}

// Enhanced auto-resize function
function autoResize(textarea) {
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const computed = window.getComputedStyle(textarea);
    const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
                 + parseInt(computed.getPropertyValue('padding-top'), 10)
                 + textarea.scrollHeight
                 + parseInt(computed.getPropertyValue('padding-bottom'), 10)
                 + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
    
    const maxHeight = 120; // Maximum height in pixels
    textarea.style.height = Math.min(height, maxHeight) + 'px';
    
    // Show/hide scroll if needed
    textarea.style.overflowY = height > maxHeight ? 'auto' : 'hidden';
}

// Enhanced notification functions
function playNotificationSound() {
    if (!soundsEnabled) return;
    
    try {
        // Create a more pleasant notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Create a pleasant two-tone notification
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.warn('Could not play notification sound:', error);
    }
}

function showErrorMessage(message) {
    displaySystemMessage(message, 'error');
    console.error('Error:', message);
}

function showSuccessMessage(message) {
    displaySystemMessage(message, 'success');
    console.log('Success:', message);
}

// Enhanced UI control functions
function toggleUsersList() {
    const sidebar = document.getElementById('usersSidebar');
    if (!sidebar) return;
    
    const isActive = sidebar.classList.toggle('active');
    
    // Update button state
    const button = document.querySelector('.users-btn');
    if (button) {
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-expanded', isActive);
    }
    
    // Manage focus
    if (isActive) {
        const firstUser = sidebar.querySelector('.user-item');
        if (firstUser) {
            firstUser.focus();
        }
    }
}

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    const isActive = modal.classList.toggle('active');
    
    // Manage focus and accessibility
    if (isActive) {
        modal.setAttribute('aria-hidden', 'false');
        const firstButton = modal.querySelector('button');
        if (firstButton) {
            firstButton.focus();
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    } else {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (!picker) return;
    
    const isVisible = picker.style.display !== 'none';
    
    picker.style.display = isVisible ? 'none' : 'block';
    
    // Update button state
    const button = document.querySelector('.emoji-btn');
    if (button) {
        button.classList.toggle('active', !isVisible);
        button.setAttribute('aria-expanded', !isVisible);
    }
    
    if (!isVisible) {
        // Focus first emoji for keyboard users
        const firstEmoji = picker.querySelector('.emoji-grid span');
        if (firstEmoji) {
            firstEmoji.focus();
        }
    }
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    const cursorPos = messageInput.selectionStart;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(cursorPos);
    
    const newValue = textBefore + emoji + textAfter;
    
    // Check length limit
    if (newValue.length <= CONFIG.MAX_MESSAGE_LENGTH) {
        messageInput.value = newValue;
        messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;
        
        // Update UI
        autoResize(messageInput);
        updateCharacterCount(newValue.length);
        updateSendButton(newValue.length > 0);
        
        // Focus back to input
        messageInput.focus();
    } else {
        showErrorMessage('Message would be too long with this emoji');
    }
    
    // Close picker after selection
    toggleEmojiPicker();
}

// Enhanced theme and settings functions
function changeTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeButton(newTheme);
    showSuccessMessage(`Switched to ${newTheme} theme`);
}

function updateThemeButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const text = button.querySelector('span');
    
    if (theme === 'dark') {
        if (icon) icon.className = 'fas fa-sun';
        if (text) text.textContent = 'Light Theme';
    } else {
        if (icon) icon.className = 'fas fa-moon';
        if (text) text.textContent = 'Dark Theme';
    }
}

// Enhanced initialization for DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatApp);
} else {
    initializeChatApp();
}

// Enhanced error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorMessage('An unexpected error occurred. Please refresh if issues persist.');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('A connection error occurred. Please check your internet connection.');
});

// Save state before leaving
window.addEventListener('beforeunload', () => {
    // Save current chat state
    localStorage.setItem('lastChatMode', currentChatMode);
    if (selectedUser) {
        localStorage.setItem('selectedUserId', selectedUser.id);
    }
});

// Restore state on load
function restoreState() {
    const lastMode = localStorage.getItem('lastChatMode');
    const selectedUserId = localStorage.getItem('selectedUserId');
    
    if (lastMode === 'personal' && selectedUserId) {
        // Will be handled when user list is loaded
        setTimeout(() => {
            switchToPersonalChat();
            // Find and select the user
            const users = document.querySelectorAll('.user-selector-item');
            const targetUser = Array.from(users).find(user => 
                user.dataset.userId === selectedUserId
            );
            if (targetUser) {
                targetUser.click();
            }
        }, 2000);
    }
}

// Make all functions globally available for HTML onclick handlers
Object.assign(window, {
    // Core chat functions
    switchToGroupChat,
    switchToPersonalChat,
    selectUserForPersonalChat,
    startPersonalChat,
    sendMessage,
    refreshChatHistory,
    
    // UI control functions
    toggleUsersList,
    toggleSettings,
    toggleEmojiPicker,
    insertEmoji,
    
    // Settings functions
    changeTheme,
    toggleNotifications,
    toggleSounds,
    toggleOnlineStatus,
    
    // Navigation functions
    goBack,
    logout,
    
    // Input handlers
    handleKeyDown,
    autoResize,
    
    // Utility functions
    Utils,
    playNotificationSound,
    showErrorMessage,
    showSuccessMessage,
    
    // Error handling and retry functions
    retryOperation,
    retryFileUpload,
    checkFirebaseStatus,
    testFirebaseConnection,
    testFirebaseStorage,
    diagnoseFileUpload,
    
    // File handling functions
    openImageModal,
    downloadFile,
    
    // State restoration
    restoreState
});

// Initialize state restoration
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(restoreState, 1000);
});

console.log('🚀 Enhanced ChatApp loaded successfully!');

// Enhanced connection status update function
function updateConnectionStatus(isConnected) {
    const statusElements = document.querySelectorAll('.connection-indicator, .status-indicator');
    const statusDots = document.querySelectorAll('.status-dot, .connection-dot');
    
    statusElements.forEach(element => {
        element.classList.toggle('connected', isConnected);
        element.classList.toggle('disconnected', !isConnected);
    });
    
    statusDots.forEach(dot => {
        dot.style.backgroundColor = isConnected ? 'var(--success-500)' : 'var(--warning-500)';
    });
    
    // Update status text
    document.querySelectorAll('.status-text').forEach(text => {
        if (text.id !== 'onlineCount') {
            text.textContent = isConnected ? 'Connected' : 'Disconnected';
        }
    });
    
    // Update document title
    if (!isConnected) {
        document.title = 'ChatApp - Disconnected';
    } else {
        document.title = 'ChatApp - Chat Interface';
    }
}

// Enhanced message search functionality
function searchMessages(query) {
    if (!query.trim()) {
        clearMessageSearch();
        return;
    }
    
    const messages = document.querySelectorAll('.message');
    const searchResults = [];
    
    messages.forEach(message => {
        const messageText = message.querySelector('.message-text')?.textContent || '';
        const senderName = message.querySelector('.message-sender')?.textContent || '';
        
        if (messageText.toLowerCase().includes(query.toLowerCase()) || 
            senderName.toLowerCase().includes(query.toLowerCase())) {
            searchResults.push(message);
            message.classList.add('search-highlight');
        } else {
            message.classList.remove('search-highlight');
        }
    });
    
    // Show search results count
    if (searchResults.length > 0) {
        showSuccessMessage(`Found ${searchResults.length} message(s) matching "${query}"`);
        
        // Scroll to first result
        if (searchResults[0]) {
            searchResults[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        showErrorMessage(`No messages found matching "${query}"`);
    }
}

function clearMessageSearch() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        message.classList.remove('search-highlight');
    });
}

// Enhanced message reactions
function addReaction(messageId, reaction) {
    if (!socket || !socket.connected) {
        showErrorMessage('Not connected to server');
        return;
    }
    
    socket.emit('addReaction', {
        messageId: messageId,
        reaction: reaction,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.name
    });
}

function displayReactions(messageElement, reactions) {
    const reactionsContainer = messageElement.querySelector('.message-reactions');
    if (!reactionsContainer) return;
    
    reactionsContainer.innerHTML = '';
    
    Object.entries(reactions).forEach(([reaction, users]) => {
        const reactionElement = document.createElement('span');
        reactionElement.className = 'reaction';
        reactionElement.innerHTML = `
            <span class="reaction-emoji">${reaction}</span>
            <span class="reaction-count">${users.length}</span>
        `;
        
        reactionElement.addEventListener('click', () => {
            addReaction(messageElement.dataset.messageId, reaction);
        });
        
        reactionsContainer.appendChild(reactionElement);
    });
}

// Enhanced file upload functionality
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('File selected:', file.name, file.size, file.type);
    
    // Check if user is authenticated
    if (!currentUser || !currentUser.uid) {
        showErrorMessage('Please sign in to upload files');
        event.target.value = '';
        return;
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showErrorMessage(`File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        event.target.value = '';
        return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showErrorMessage(`Only image files are allowed. File type: ${file.type}`);
        event.target.value = '';
        return;
    }
    
    // Check if file name is valid
    if (file.name.length > 100) {
        showErrorMessage('File name is too long. Please use a shorter name.');
        event.target.value = '';
        return;
    }
    
    // Check for special characters in filename
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
        showErrorMessage('File name contains invalid characters. Please rename the file.');
        event.target.value = '';
        return;
    }
    
    console.log('File validation passed, starting upload...');
    uploadFile(file);
}

async function uploadFile(file) {
    try {
        console.log('Starting file upload...', file.name, file.size, file.type);
        showLoadingMessage('Uploading file...');
        
        // Check if Firebase Storage is available
        if (!firebase || !firebase.storage) {
            throw new Error('Firebase Storage not initialized');
        }
        
        // Check if user is authenticated
        if (!currentUser || !currentUser.uid) {
            throw new Error('User not authenticated');
        }
        
        // Create a unique filename with user ID and timestamp
        const timestamp = Date.now();
        const uniqueFileName = `${currentUser.uid}_${timestamp}_${file.name}`;
        const filePath = `chat-files/${uniqueFileName}`;
        
        console.log('Creating storage reference for:', filePath);
        
        // Create a reference to the file location
        const storageRef = firebase.ref(firebase.storage, filePath);
        
        console.log('Starting upload...');
        
        // Upload the file with metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadedBy: currentUser.uid,
                originalName: file.name,
                uploadedAt: timestamp.toString()
            }
        };
        
        const uploadTask = firebase.uploadBytes(storageRef, file, metadata);
        
        // Wait for upload to complete
        const snapshot = await uploadTask;
        
        console.log('Upload completed, getting download URL...');
        
        // Get download URL
        const downloadURL = await firebase.getDownloadURL(snapshot.ref);
        
        console.log('Download URL obtained:', downloadURL);
        
        // Create message data
        const messageData = {
            text: `📎 ${file.name}`,
            fileURL: downloadURL,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: Date.now(),
            id: Utils.generateMessageId(),
            edited: false,
            reactions: {},
            uploadedBy: currentUser.uid,
            filePath: filePath
        };
        
        console.log('Sending message with file data...');
        
        // Send message based on chat mode
        if (currentChatMode === 'group') {
            socket.emit('sendMessage', messageData);
        } else if (currentChatMode === 'personal' && selectedUser) {
            socket.emit('sendPersonalMessage', {
                ...messageData,
                toUserId: selectedUser.id
            });
        }
        
        hideLoadingMessage();
        showSuccessMessage('File uploaded successfully');
        
        // Clear the file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
    } catch (error) {
        console.error('Error uploading file:', error);
        hideLoadingMessage();
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload file. Please try again.';
        
        if (error.message.includes('Firebase Storage not initialized')) {
            errorMessage = 'Storage service not available. Please refresh the page.';
        } else if (error.message.includes('User not authenticated')) {
            errorMessage = 'Please sign in to upload files.';
        } else if (error.message.includes('permission-denied')) {
            errorMessage = 'Upload permission denied. Please check your account.';
        } else if (error.message.includes('storage/unauthorized')) {
            errorMessage = 'Unauthorized to upload files. Please sign in again.';
        } else if (error.message.includes('storage/quota-exceeded')) {
            errorMessage = 'Storage quota exceeded. Please try a smaller file.';
        } else if (error.message.includes('storage/retry-limit-exceeded')) {
            errorMessage = 'Upload failed due to network issues. Please try again.';
        }
        
        showErrorMessage(errorMessage);
        
        // Clear the file input on error
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// Enhanced message editing
function editMessage(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    const messageText = messageElement.querySelector('.message-text');
    const originalText = messageText.textContent;
    
    // Create edit input
    const editInput = document.createElement('textarea');
    editInput.className = 'message-edit-input';
    editInput.value = originalText;
    editInput.style.cssText = `
        width: 100%;
        min-height: 60px;
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-family: inherit;
        font-size: inherit;
        resize: vertical;
    `;
    
    // Replace text with input
    messageText.style.display = 'none';
    messageText.parentNode.insertBefore(editInput, messageText);
    editInput.focus();
    
    // Handle save/cancel
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveMessageEdit(messageId, editInput.value, messageText, editInput);
        } else if (e.key === 'Escape') {
            cancelMessageEdit(messageText, editInput);
        }
    });
    
    // Add save/cancel buttons
    const editActions = document.createElement('div');
    editActions.className = 'message-edit-actions';
    editActions.innerHTML = `
        <button onclick="saveMessageEdit('${messageId}', '${editInput.value.replace(/'/g, "\\'")}', messageText, editInput)" class="save-edit-btn">Save</button>
        <button onclick="cancelMessageEdit(messageText, editInput)" class="cancel-edit-btn">Cancel</button>
    `;
    editInput.parentNode.insertBefore(editActions, editInput.nextSibling);
}

function saveMessageEdit(messageId, newText, messageText, editInput) {
    if (!newText.trim()) {
        showErrorMessage('Message cannot be empty');
        return;
    }
    
    if (newText.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showErrorMessage(`Message too long. Maximum ${CONFIG.MAX_MESSAGE_LENGTH} characters allowed.`);
        return;
    }
    
    // Send edit to server
    if (socket && socket.connected) {
        socket.emit('editMessage', {
            messageId: messageId,
            newText: newText,
            timestamp: Date.now()
        });
    }
    
    // Update UI immediately
    messageText.textContent = newText;
    messageText.style.display = 'block';
    editInput.remove();
    
    const editActions = document.querySelector('.message-edit-actions');
    if (editActions) editActions.remove();
    
    showSuccessMessage('Message edited successfully');
}

function cancelMessageEdit(messageText, editInput) {
    messageText.style.display = 'block';
    editInput.remove();
    
    const editActions = document.querySelector('.message-edit-actions');
    if (editActions) editActions.remove();
}

// Enhanced message deletion
function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    if (socket && socket.connected) {
        socket.emit('deleteMessage', {
            messageId: messageId,
            timestamp: Date.now()
        });
    }
    
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.style.opacity = '0';
        setTimeout(() => messageElement.remove(), 300);
    }
    
    showSuccessMessage('Message deleted successfully');
}

// Enhanced user profile management
function updateUserProfile(profileData) {
    if (!currentUser) return;
    
    firebase.updateDoc(firebase.doc(firebase.db, 'users', currentUser.uid), {
        displayName: profileData.displayName,
        bio: profileData.bio,
        status: profileData.status,
        lastUpdated: firebase.serverTimestamp()
    }).then(() => {
        showSuccessMessage('Profile updated successfully');
        
        // Update local user data
        currentUser = { ...currentUser, ...profileData };
        
        // Update UI
        updateUserProfileUI();
    }).catch((error) => {
        console.error('Error updating profile:', error);
        showErrorMessage('Failed to update profile');
    });
}

function updateUserProfileUI() {
    const profileName = document.querySelector('.profile-name');
    const profileBio = document.querySelector('.profile-bio');
    const profileStatus = document.querySelector('.profile-status');
    
    if (profileName) profileName.textContent = currentUser.displayName || currentUser.name;
    if (profileBio) profileBio.textContent = currentUser.bio || 'No bio set';
    if (profileStatus) profileStatus.textContent = currentUser.status || 'Available';
}

// Enhanced chat export functionality
function exportChatHistory() {
    const messages = document.querySelectorAll('.message');
    const chatData = [];
    
    messages.forEach(message => {
        const sender = message.querySelector('.message-sender')?.textContent || '';
        const text = message.querySelector('.message-text')?.textContent || '';
        const time = message.querySelector('.message-time')?.textContent || '';
        
        chatData.push({
            sender: sender,
            message: text,
            time: time
        });
    });
    
    const chatText = chatData.map(msg => 
        `[${msg.time}] ${msg.sender}: ${msg.message}`
    ).join('\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessMessage('Chat history exported successfully');
}

// Enhanced keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + F for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('messageSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportChatHistory();
        }
        
        // Ctrl/Cmd + U for file upload
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            }
        }
    });
}

// Enhanced performance monitoring
function setupPerformanceMonitoring() {
    // Monitor message rendering performance
    let messageCount = 0;
    const startTime = performance.now();
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && 
                    node.classList.contains('message')) {
                    messageCount++;
                    
                    if (messageCount % 50 === 0) {
                        const currentTime = performance.now();
                        const avgTime = (currentTime - startTime) / messageCount;
                        console.log(`Average message render time: ${avgTime.toFixed(2)}ms`);
                    }
                }
            });
        });
    });
    
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        observer.observe(messagesContainer, { childList: true });
    }
}

// Enhanced error recovery
function setupErrorRecovery() {
    let errorCount = 0;
    const maxErrors = 5;
    
    window.addEventListener('error', () => {
        errorCount++;
        
        if (errorCount >= maxErrors) {
            showErrorMessage('Too many errors detected. Refreshing page...');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });
    
    // Reset error count on successful operations
    window.addEventListener('message', () => {
        errorCount = Math.max(0, errorCount - 1);
    });
}

// Enhanced initialization with all features
function initializeAdvancedFeatures() {
    setupKeyboardShortcuts();
    setupPerformanceMonitoring();
    setupErrorRecovery();
    
    // Initialize file upload
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    // Initialize search functionality
    const searchInput = document.getElementById('messageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchMessages(e.target.value);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                clearMessageSearch();
            }
        });
    }
}

// Enhanced cleanup function
function cleanup() {
    // Disconnect socket
    if (socket && socket.connected) {
        socket.disconnect();
    }
    
    // Clear intervals
    if (window.heartbeatInterval) {
        clearInterval(window.heartbeatInterval);
    }
    
    // Remove event listeners
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    
    // Clear local storage
    localStorage.removeItem('lastChatMode');
    localStorage.removeItem('selectedUserId');
    
    console.log('🧹 ChatApp cleanup completed');
}

// Enhanced final initialization
document.addEventListener('DOMContentLoaded', () => {
    // Add global error handlers
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        showErrorMessage('An unexpected error occurred. Please refresh if issues persist.');
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showErrorMessage('A connection error occurred. Please check your internet connection.');
    });

    // Check if file input exists
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) {
        console.warn('File input element not found. File upload functionality may not work.');
    } else {
        console.log('File input element found and configured');
    }

    initializeChatApp().then(() => {
        initializeAdvancedFeatures();
        setTimeout(restoreState, 1000);
    }).catch((error) => {
        console.error('Failed to initialize chat app:', error);
        showErrorMessage('Failed to initialize chat application');
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

console.log('🚀 Enhanced ChatApp with all features loaded successfully!');