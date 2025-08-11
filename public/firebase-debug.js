// Firebase Debug Script - Comprehensive Testing
console.log('🔍 Starting Firebase Debug Tests...');

// Test 1: Check Firebase SDK Loading
function testFirebaseSDK() {
    console.log('📦 Testing Firebase SDK...');
    
    if (typeof window.firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded!');
        return false;
    }
    
    console.log('✅ Firebase SDK loaded successfully');
    console.log('Available methods:', Object.keys(window.firebase));
    return true;
}

// Test 2: Check Firebase Configuration
function testFirebaseConfig() {
    console.log('⚙️ Testing Firebase Configuration...');
    
    try {
        if (!window.firebase.auth) {
            console.error('❌ Firebase Auth not available');
            return false;
        }
        
        if (!window.firebase.db) {
            console.error('❌ Firebase Firestore not available');
            return false;
        }
        
        console.log('✅ Firebase configuration looks good');
        return true;
    } catch (error) {
        console.error('❌ Firebase configuration error:', error);
        return false;
    }
}

// Test 3: Test Authentication
async function testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
        // Test anonymous sign-in
        const result = await window.firebase.auth().signInAnonymously();
        console.log('✅ Anonymous authentication successful:', result.user.uid);
        
        // Sign out
        await window.firebase.auth().signOut();
        console.log('✅ Sign out successful');
        
        return true;
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        return false;
    }
}

// Test 4: Test Firestore Write
async function testFirestoreWrite() {
    console.log('✍️ Testing Firestore Write...');
    
    try {
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Firebase debug test'
        };
        
        const docRef = await window.firebase.addDoc(
            window.firebase.collection(window.firebase.db, 'debug_test'),
            testData
        );
        
        console.log('✅ Firestore write successful, document ID:', docRef.id);
        
        // Clean up - delete the test document
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'debug_test', docRef.id));
        console.log('✅ Test document cleaned up');
        
        return true;
    } catch (error) {
        console.error('❌ Firestore write error:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        return false;
    }
}

// Test 5: Test Firestore Read
async function testFirestoreRead() {
    console.log('📖 Testing Firestore Read...');
    
    try {
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Firebase read test'
        };
        
        // Write test data
        const docRef = await window.firebase.addDoc(
            window.firebase.collection(window.firebase.db, 'debug_test'),
            testData
        );
        
        // Read test data
        const docSnap = await window.firebase.getDoc(
            window.firebase.doc(window.firebase.db, 'debug_test', docRef.id)
        );
        
        if (docSnap.exists()) {
            console.log('✅ Firestore read successful:', docSnap.data());
        } else {
            console.error('❌ Document does not exist');
            return false;
        }
        
        // Clean up
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'debug_test', docRef.id));
        
        return true;
    } catch (error) {
        console.error('❌ Firestore read error:', error.message);
        return false;
    }
}

// Test 6: Test Real-time Listeners
async function testRealtimeListeners() {
    console.log('👂 Testing Real-time Listeners...');
    
    try {
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Real-time test'
        };
        
        let listenerCalled = false;
        
        // Set up listener
        const unsubscribe = window.firebase.onSnapshot(
            window.firebase.collection(window.firebase.db, 'debug_test'),
            (snapshot) => {
                console.log('✅ Real-time listener triggered');
                listenerCalled = true;
                snapshot.docChanges().forEach((change) => {
                    console.log('Change type:', change.type, 'Document:', change.doc.data());
                });
            },
            (error) => {
                console.error('❌ Real-time listener error:', error);
            }
        );
        
        // Write data to trigger listener
        const docRef = await window.firebase.addDoc(
            window.firebase.collection(window.firebase.db, 'debug_test'),
            testData
        );
        
        // Wait a bit for listener to trigger
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clean up
        unsubscribe();
        await window.firebase.deleteDoc(window.firebase.doc(window.firebase.db, 'debug_test', docRef.id));
        
        if (listenerCalled) {
            console.log('✅ Real-time listeners working');
            return true;
        } else {
            console.error('❌ Real-time listener not triggered');
            return false;
        }
    } catch (error) {
        console.error('❌ Real-time listener test error:', error.message);
        return false;
    }
}

// Test 7: Check Firebase Rules
async function testFirebaseRules() {
    console.log('🔒 Testing Firebase Rules...');
    
    try {
        // Try to read from a collection that might have restricted access
        const querySnapshot = await window.firebase.getDocs(
            window.firebase.collection(window.firebase.db, 'messages')
        );
        
        console.log('✅ Firebase rules allow reading messages collection');
        console.log('Number of messages:', querySnapshot.size);
        
        return true;
    } catch (error) {
        console.error('❌ Firebase rules error:', error.message);
        console.error('This might indicate permission issues');
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting comprehensive Firebase tests...\n');
    
    const tests = [
        { name: 'Firebase SDK', fn: testFirebaseSDK },
        { name: 'Firebase Config', fn: testFirebaseConfig },
        { name: 'Authentication', fn: testAuthentication },
        { name: 'Firestore Write', fn: testFirestoreWrite },
        { name: 'Firestore Read', fn: testFirestoreRead },
        { name: 'Real-time Listeners', fn: testRealtimeListeners },
        { name: 'Firebase Rules', fn: testFirebaseRules }
    ];
    
    const results = [];
    
    for (const test of tests) {
        console.log(`\n--- ${test.name} Test ---`);
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`❌ ${test.name} test failed with exception:`, error);
            results.push({ name: test.name, passed: false });
        }
    }
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${result.name}`);
    });
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Firebase is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above for details.');
    }
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Make function available globally for manual testing
window.runFirebaseTests = runAllTests; 