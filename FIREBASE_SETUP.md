# Firebase Setup Guide - Fix Configuration Errors

## 🔧 Step-by-Step Firebase Configuration

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Sign in with your Google account

### 2. Create/Select Your Project
- If you don't have a project: Click "Create a project"
- If you have a project: Select "chatapp-9cd86" from the dropdown

### 3. Enable Authentication
1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable these providers:
   - **Email/Password**: Click "Enable" and save
   - **Google**: Click "Enable", add your support email, and save

### 4. Enable Firestore Database
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location (choose closest to your users)
5. Click **"Done"**

### 5. Get Your Configuration
1. Click the gear icon ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If no web app exists, click **"Add app"** and choose the web icon
5. Register your app with a nickname (e.g., "ChatApp Web")
6. Copy the configuration object

### 6. Update Your Configuration
Replace the configuration in `public/firebase-config.js` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};
```

### 7. Set Up Security Rules (Optional)
In Firestore Database → Rules, update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 8. Test Your Setup
1. Restart your server: `npm run dev`
2. Open browser console (F12)
3. Check for Firebase initialization success
4. Try signing up/signing in

## 🚨 Common Issues & Solutions

### Issue: "CONFIGURATION_NOT_FOUND"
**Solution**: 
- Verify your Firebase project exists
- Check that Authentication is enabled
- Ensure your config matches the Firebase Console

### Issue: "API key not valid"
**Solution**:
- Copy the exact API key from Firebase Console
- Don't modify or truncate the key

### Issue: "Domain not authorized"
**Solution**:
- In Authentication → Settings → Authorized domains
- Add `localhost` for development
- Add your production domain when deploying

### Issue: "Firestore permission denied"
**Solution**:
- Check Firestore security rules
- Ensure database is created
- Verify you're in test mode for development

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore Database created
- [ ] Web app registered
- [ ] Configuration copied correctly
- [ ] Security rules set (optional)
- [ ] Authorized domains configured
- [ ] Server restarted after changes

## 🔍 Debug Steps

1. **Check Browser Console**:
   ```javascript
   // In browser console, type:
   console.log(window.firebase);
   // Should show Firebase object with auth, db, etc.
   ```

2. **Test Authentication**:
   ```javascript
   // In browser console:
   firebase.auth().signInAnonymously()
     .then(() => console.log('Auth working!'))
     .catch(err => console.error('Auth error:', err));
   ```

3. **Test Firestore**:
   ```javascript
   // In browser console:
   firebase.firestore().collection('test').add({test: true})
     .then(() => console.log('Firestore working!'))
     .catch(err => console.error('Firestore error:', err));
   ```

## 📞 Need Help?

If you're still having issues:
1. Double-check all steps above
2. Verify your Firebase project ID matches
3. Ensure all services are enabled
4. Check browser console for specific error messages
5. Try in incognito/private browsing mode 