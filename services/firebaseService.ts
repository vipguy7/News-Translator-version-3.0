import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Firestore Error Information Interfaces (As required by Firebase Integration Skill)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Data Structure
export interface UserProfile {
  uid: string;
  email: string;
  credits: number;
  customApiKey?: string;
  lastDailyReset: string; // Format: YYYY-MM-DD
}

// Format date to local YYYY-MM-DD
export function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Ensure Connection is Valid (Required Connection validation)
async function validateFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline. Please check network configuration.");
    }
  }
}
validateFirebaseConnection();

// Fetch or create a user profile in Firestore
export async function getOrCreateUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const today = getLocalDateString();
  
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let credits = data.credits ?? 30;
      let lastDailyReset = data.lastDailyReset ?? today;
      
      // Perform daily credit reset check (30 credits a day)
      if (lastDailyReset !== today) {
        credits = 30;
        lastDailyReset = today;
        await updateDoc(userRef, { credits, lastDailyReset });
      }
      
      return {
        uid: user.uid,
        email: user.email || '',
        credits,
        customApiKey: data.customApiKey || '',
        lastDailyReset
      };
    } else {
      // Create a brand new user profile
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        credits: 30,
        customApiKey: '',
        lastDailyReset: today
      };
      await setDoc(userRef, {
        email: newProfile.email,
        credits: newProfile.credits,
        customApiKey: newProfile.customApiKey,
        lastDailyReset: newProfile.lastDailyReset
      });
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    throw error;
  }
}

// Update Custom API Key
export async function updateUserApiKey(uid: string, customApiKey: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, { customApiKey });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// Consume 1 credit
export async function consumeSystemCredit(uid: string, currentCredits: number): Promise<number> {
  if (currentCredits <= 0) {
    throw new Error('Your system credits of 30 limit have been exhausted. Please enter your personal custom Gemini API Key inside Settings or try again tomorrow.');
  }
  const userRef = doc(db, 'users', uid);
  const newCredits = currentCredits - 1;
  try {
    await updateDoc(userRef, { credits: newCredits });
    return newCredits;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    throw error;
  }
}
