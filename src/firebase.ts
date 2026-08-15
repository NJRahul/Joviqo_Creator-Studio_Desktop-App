import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDpEVsl2dC97CuoMzYn7kW0fWPjLhhZBX0',
  authDomain: 'joviqo.firebaseapp.com',
  projectId: 'joviqo',
  storageBucket: 'joviqo.firebasestorage.app',
  messagingSenderId: '273808625524',
  appId: '1:273808625524:web:40e9006c90d966ab95a621',
  measurementId: 'G-N78L941STK',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
