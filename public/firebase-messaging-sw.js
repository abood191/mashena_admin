importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC3JPU679Zzi-12uiBsBt6VorUv5Fn-9Og",
  authDomain: "mashena-e39bd.firebaseapp.com",
  projectId: "mashena-e39bd",
  storageBucket: "mashena-e39bd.firebasestorage.app",
  messagingSenderId: "1054047692408",
  appId: "1:1054047692408:web:a7820fd7f127d8ea576f8d"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification?.title || "Mashena Admin Notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/favicon.ico"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
