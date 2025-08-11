// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, addDoc, deleteDoc, query, orderBy, onSnapshot, where, limit, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-storage.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc1mX065SM1nAJijqjEKfcq8aB4G_usD4",
  authDomain: "chatapp-9cd86.firebaseapp.com",
  projectId: "chatapp-9cd86",
  storageBucket: "chatapp-9cd86.firebasestorage.app",
  messagingSenderId: "817317249530",
  appId: "1:817317249530:web:339229e9c1e1d894302443",
  measurementId: "G-B2S711R6SB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Make Firebase available globally
window.firebase = {
  auth,
  db,
  storage,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
  serverTimestamp,
  updateDoc,
  ref,
  uploadBytes,
  getDownloadURL
};

// Signal that Firebase is ready
window.firebaseReady = true;

console.log('Firebase initialized successfully'); 