// Firebase Configuration Test Script
// Add this to your HTML to test Firebase setup

console.log('🔍 Testing Firebase Configuration...');

// Test 1: Check if Firebase is loaded
if (typeof window.firebase === 'undefined') {
    console.error('❌ Firebase not loaded! Check your firebase-config.js file.');
} else {
    console.log('✅ Firebase object found:', window.firebase);
}

// Test 2: Check Authentication
if (window.firebase && window.firebase.auth) {
    console.log('✅ Firebase Auth available');
    
    // Test anonymous sign-in
    window.firebase.auth().signInAnonymously()
        .then(() => {
            console.log('✅ Authentication working!');
            return window.firebase.auth().signOut();
        })
        .catch(err => {
            console.error('❌ Authentication error:', err.message);
        });
} else {
    console.error('❌ Firebase Auth not available');
}

// Test 3: Check Firestore
if (window.firebase && window.firebase.db) {
    console.log('✅ Firebase Firestore available');
    
    // Test database connection
    const testDoc = window.firebase.collection('test').doc('connection-test');
    testDoc.set({
        timestamp: new Date(),
        test: true
    })
    .then(() => {
        console.log('✅ Firestore connection working!');
        return testDoc.delete();
    })
    .catch(err => {
        console.error('❌ Firestore error:', err.message);
    });
} else {
    console.error('❌ Firebase Firestore not available');
}

// Test 4: Check Google Provider
if (window.firebase && window.firebase.googleProvider) {
    console.log('✅ Google Auth Provider available');
} else {
    console.error('❌ Google Auth Provider not available');
}

// Test 5: List all available Firebase methods
if (window.firebase) {
    console.log('📋 Available Firebase methods:', Object.keys(window.firebase));
}

console.log('🔍 Firebase test completed. Check console for results.'); 