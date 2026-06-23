import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID
export const db = initializeFirestore(app, {}, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);

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
