# Firebase Admin SDK Setup Guide

## 🚨 Current Issue
The server is using the regular Firebase SDK which requires user authentication. For server-side operations, you need the Firebase Admin SDK.

## 🔧 Solution: Firebase Admin SDK

### **Step 1: Install Admin SDK**
```bash
npm install firebase-admin
```

### **Step 2: Get Service Account Key**
1. Go to Firebase Console → Project Settings
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. Save it as `serviceAccountKey.json` in your project root

### **Step 3: Update Server Code**
Replace the Firebase initialization in `server.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
```

### **Step 4: Update Firebase Operations**
Replace `addDoc` calls with:

```javascript
// Instead of: addDoc(collection(db, 'messages'), data)
await db.collection('messages').add(data);
```

## 🛡️ Security Rules for Production

For production, use proper authentication rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write personal messages
    match /personal_messages/{messageId} {
      allow read, write: if request.auth != null && 
        (resource.data.fromUserId == request.auth.uid || 
         resource.data.toUserId == request.auth.uid);
    }
  }
}
```

## ⚠️ Important Notes

1. **Never commit serviceAccountKey.json** to version control
2. **Add to .gitignore**: `serviceAccountKey.json`
3. **Use environment variables** in production
4. **Admin SDK bypasses security rules** - use with caution 