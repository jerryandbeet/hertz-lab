// Official Firebase Realtime Database Telemetry Service for Hertz Application
// Tracks genuine live online users (via WebSockets Presence) and persistent all-time visits

import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  push, 
  set, 
  onDisconnect, 
  runTransaction,
  serverTimestamp 
} from 'firebase/database';

export interface LiveStats {
  totalVisitors: number;
  onlineUsers: number;
}

const firebaseConfig = {
  apiKey: "AIzaSyAm_qS9eAzpue_m05QXo8W9aTcJy3G_lWo",
  authDomain: "hertz-63076.firebaseapp.com",
  databaseURL: "https://hertz-63076-default-rtdb.firebaseio.com",
  projectId: "hertz-63076",
  storageBucket: "hertz-63076.firebasestorage.app",
  messagingSenderId: "60721500063",
  appId: "1:60721500063:web:e3a973326d7604991f37aa",
  measurementId: "G-KEYT2W6NM7"
};

let currentStats: LiveStats = {
  totalVisitors: 1,
  onlineUsers: 1
};

const listeners = new Set<(stats: LiveStats) => void>();

function notify() {
  listeners.forEach(cb => cb({ ...currentStats }));
}

let isInitialized = false;

export async function initRealtimeStats(): Promise<void> {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getDatabase(app);

    // 1. Genuine Presence System: listen to Firebase .info/connected
    const connectedRef = ref(db, '.info/connected');
    const onlineUsersRef = ref(db, 'presence');

    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Current tab is connected - register presence node
        const myPresenceRef = push(onlineUsersRef);

        // When user closes tab, navigates away, or loses connection, remove immediately
        onDisconnect(myPresenceRef).remove();

        set(myPresenceRef, {
          joinedAt: serverTimestamp()
        }).catch(() => {});
      }
    });

    // Subscribe to genuine concurrent online user count
    onValue(onlineUsersRef, (snapshot) => {
      const count = snapshot.size;
      currentStats.onlineUsers = Math.max(1, count);
      notify();
    });

    // 2. Genuine All-time Unique Visit Counter
    const totalRef = ref(db, 'stats/totalVisits');
    const SESSION_VISIT_KEY = 'hertz_session_visit_counted';

    if (!sessionStorage.getItem(SESSION_VISIT_KEY)) {
      sessionStorage.setItem(SESSION_VISIT_KEY, '1');
      runTransaction(totalRef, (currentVal) => {
        return (currentVal || 0) + 1;
      }).catch((err) => {
        console.warn('Transaction visit count update:', err);
      });
    }

    // Subscribe to total visits count
    onValue(totalRef, (snapshot) => {
      const val = snapshot.val();
      if (typeof val === 'number' && val > 0) {
        currentStats.totalVisitors = val;
        notify();
      }
    });

  } catch (err) {
    console.error('Firebase realtime stats initialization error:', err);
  }
}

export function subscribeRealtimeStats(cb: (stats: LiveStats) => void): () => void {
  listeners.add(cb);
  cb({ ...currentStats });
  return () => listeners.delete(cb);
}
