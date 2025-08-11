// Wait for Firebase to be loaded
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebase && window.firebaseReady) {
            resolve();
        } else {
            const checkFirebase = () => {
                if (window.firebase && window.firebaseReady) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        }
    });
}

// Initialize authentication when Firebase is ready
async function initializeAuth() {
    try {
        await waitForFirebase();
        setupAuthListeners();
        console.log('Authentication initialized successfully');
    } catch (error) {
        console.error('Error initializing authentication:', error);
    }
}

// Setup authentication event listeners
function setupAuthListeners() {
    // Sign in form
    const signinForm = document.getElementById('signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }

    // Sign up form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }

    // Check if user is already signed in
    firebase.onAuthStateChanged(firebase.auth, (user) => {
        if (user) {
            // User is signed in, redirect to chat
            window.location.href = '/chat';
        }
    });
}

// Handle sign in
async function handleSignIn(e) {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        const userCredential = await firebase.signInWithEmailAndPassword(firebase.auth, email, password);
        console.log('User signed in:', userCredential.user);
        
        // Store user data in Firestore
        await storeUserData(userCredential.user);
        
        // Redirect to chat
        window.location.href = '/chat';
    } catch (error) {
        console.error('Sign in error:', error);
        let errorMessage = 'Sign in failed';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later';
                break;
            default:
                errorMessage = error.message;
        }
        
        showError(errorMessage);
    }
}

// Handle sign up
async function handleSignUp(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    try {
        const userCredential = await firebase.createUserWithEmailAndPassword(firebase.auth, email, password);
        console.log('User created:', userCredential.user);
        
        // Update user profile with name
        await firebase.updateProfile(userCredential.user, {
            displayName: name
        });
        
        // Store user data in Firestore
        await storeUserData(userCredential.user, name);
        
        // Redirect to chat
        window.location.href = '/chat';
    } catch (error) {
        console.error('Sign up error:', error);
        let errorMessage = 'Sign up failed';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled';
                break;
            default:
                errorMessage = error.message;
        }
        
        showError(errorMessage);
    }
}

// Handle Google sign in
async function signInWithGoogle() {
    try {
        const result = await firebase.signInWithPopup(firebase.auth, firebase.googleProvider);
        console.log('Google sign in successful:', result.user);
        
        // Store user data in Firestore
        await storeUserData(result.user);
        
        // Redirect to chat
        window.location.href = '/chat';
    } catch (error) {
        console.error('Google sign in error:', error);
        let errorMessage = 'Google sign in failed';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign in was cancelled';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Sign in popup was blocked. Please allow popups for this site';
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = 'Sign in was cancelled';
                break;
            default:
                errorMessage = error.message;
        }
        
        showError(errorMessage);
    }
}

// Store user data in Firestore
async function storeUserData(user, displayName = null) {
    try {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: displayName || user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };
        
        await firebase.setDoc(firebase.doc(firebase.db, 'users', user.uid), userData);
        console.log('User data stored in Firestore');
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

// Switch between sign in and sign up tabs
function switchTab(tab) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'signin') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
    }
    
    // Update forms
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => form.classList.remove('active'));
    
    if (tab === 'signin') {
        document.getElementById('signinForm').classList.add('active');
    } else {
        document.getElementById('signupForm').classList.add('active');
    }
    
    // Clear any existing errors
    clearError();
}

// Show error message
function showError(message) {
    clearError();
    
    // Create error element if it doesn't exist
    let errorElement = document.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            background: #ff6b6b;
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 0.9rem;
            text-align: center;
            animation: slideIn 0.3s ease;
        `;
        
        // Insert after the active form
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            activeForm.appendChild(errorElement);
        }
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Clear error message
function clearError() {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// Make functions available globally
window.switchTab = switchTab;
window.signInWithGoogle = signInWithGoogle; 
window.signInWithGoogle = signInWithGoogle;
window.signUpWithGoogle = signUpWithGoogle; 
window.signInWithGoogle = signInWithGoogle;
window.signUpWithGoogle = signUpWithGoogle; 