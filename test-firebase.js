// Firebase Connectivity Test Script
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDc1mX065SM1nAJijqjEKfcq8aB4G_usD4",
  authDomain: "chatapp-9cd86.firebaseapp.com",
  projectId: "chatapp-9cd86",
  storageBucket: "chatapp-9cd86.firebasestorage.app",
  messagingSenderId: "817317249530",
  appId: "1:817317249530:web:339229e9c1e1d894302443",
  measurementId: "G-B2S711R6SB"
};

console.log('🔍 Testing Firebase connectivity...');

async function testFirebase() {
  try {
    // Initialize Firebase
    console.log('📦 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');

    // Test 1: Write to Firestore
    console.log('✍️ Testing Firestore write...');
    const testData = {
      test: true,
      message: 'Server-side test message',
      timestamp: new Date().toISOString(),
      source: 'nodejs-test'
    };

    const docRef = await addDoc(collection(db, 'test_messages'), testData);
    console.log('✅ Write successful! Document ID:', docRef.id);

    // Test 2: Read from Firestore
    console.log('📖 Testing Firestore read...');
    const querySnapshot = await getDocs(collection(db, 'test_messages'));
    console.log('✅ Read successful! Found', querySnapshot.size, 'documents');

    // Test 3: Read specific document
    const docSnap = await getDocs(collection(db, 'test_messages'));
    docSnap.forEach((doc) => {
      console.log('📄 Document data:', doc.data());
    });

    // Test 4: Clean up test document
    console.log('🧹 Cleaning up test document...');
    await deleteDoc(doc(db, 'test_messages', docRef.id));
    console.log('✅ Test document deleted');

    // Test 5: Check existing messages collection
    console.log('📋 Checking existing messages collection...');
    try {
      const messagesSnapshot = await getDocs(collection(db, 'messages'));
      console.log('✅ Messages collection accessible. Found', messagesSnapshot.size, 'messages');
      
      if (messagesSnapshot.size > 0) {
        console.log('📝 Sample messages:');
        messagesSnapshot.forEach((doc, index) => {
          if (index < 3) { // Show first 3 messages
            console.log(`  ${index + 1}. ${JSON.stringify(doc.data())}`);
          }
        });
      }
    } catch (error) {
      console.log('⚠️ Could not access messages collection:', error.message);
    }

    console.log('🎉 All Firebase tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    return false;
  }
}

// Run the test
testFirebase()
  .then((success) => {
    if (success) {
      console.log('✅ Firebase is working correctly');
      process.exit(0);
    } else {
      console.log('❌ Firebase has issues');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }); 