import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC3JPU679Zzi-12uiBsBt6VorUv5Fn-9Og",
  authDomain: "mashena-e39bd.firebaseapp.com",
  projectId: "mashena-e39bd",
  storageBucket: "mashena-e39bd.firebasestorage.app",
  messagingSenderId: "1054047692408",
  appId: "1:1054047692408:web:a7820fd7f127d8ea576f8d",
  measurementId: "G-FC556F1BT1"
};

const app = initializeApp(firebaseConfig);

let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Failed to initialize Firebase Messaging:", error);
  }
}

export const requestForToken = async (vapidKey) => {
  if (!messaging) {
    console.error("Firebase Messaging is not initialized. Check if serviceWorker is supported and Firebase is configured correctly.");
    return null;
  }
  try {
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log("Notification permission granted. Fetching token...");
      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        console.log("FCM Token generated successfully:", currentToken);
        return currentToken;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      console.warn("Notification permission denied or dismissed by the user.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token: ", err);
    return null;
  }
};

export const setupOnMessageListener = (callback) => {
  if (!messaging) return;
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export { messaging };
