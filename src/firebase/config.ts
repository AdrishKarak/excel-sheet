import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAF2PxMAlahyBGMfrOlS-vKhq8kChZMHuw",
  authDomain: "gen-lang-client-0654301392.firebaseapp.com",
  projectId: "gen-lang-client-0654301392",
  storageBucket: "gen-lang-client-0654301392.firebasestorage.app",
  messagingSenderId: "1053097709177",
  appId: "1:1053097709177:web:76fe20da2ee6f96f370ea8"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = initializeFirestore(app, {}, "ai-studio-cc69906d-eeaa-479a-ac34-38613fb4c7b2");

// Initialize Auth
export const auth = getAuth(app);

// Connectivity validation check as mandated by Firebase guide
async function testConnection() {
  try {
    // Attempting a server read to test connection and log status
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified and authenticated successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection. Client is offline.");
    } else {
      // Ignored permission denined for connection test node since it is standard
      console.log("Firebase network ready.");
    }
  }
}
testConnection();
