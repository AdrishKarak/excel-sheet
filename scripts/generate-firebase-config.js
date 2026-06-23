import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env
dotenv.config({ path: path.join(rootDir, '.env') });

const config = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "",
  appId: process.env.VITE_FIREBASE_APP_ID || "",
  apiKey: process.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  firestoreDatabaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  measurementId: ""
};

fs.writeFileSync(
  path.join(rootDir, 'firebase-applet-config.json'),
  JSON.stringify(config, null, 2),
  'utf-8'
);

console.log('Successfully generated firebase-applet-config.json from .env');
