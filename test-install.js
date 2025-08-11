// Simple test to check if Node.js is working
console.log('Node.js is working!');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Try to require express
try {
    const express = require('express');
    console.log('✅ Express is installed and working!');
} catch (error) {
    console.error('❌ Express not found:', error.message);
    console.log('Please run: npm install');
}

// Try to require socket.io
try {
    const socketio = require('socket.io');
    console.log('✅ Socket.IO is installed and working!');
} catch (error) {
    console.error('❌ Socket.IO not found:', error.message);
    console.log('Please run: npm install');
} 