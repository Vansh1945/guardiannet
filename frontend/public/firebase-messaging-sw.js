importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// 🔹 Paste your Firebase Config here
const firebaseConfig = {
    apiKey: "AIzaSyBuZA3xFzsuHU1saqPTwz_PZ50jkLCSf08",
    authDomain: "society-security-system-ea11c.firebaseapp.com",
    projectId: "society-security-system-ea11c",
    storageBucket: "society-security-system-ea11c.firebasestorage.app",
    messagingSenderId: "948210305457",
    appId: "1:948210305457:web:379989f8843e958401d590",

};

// 🔥 Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 🔹 Handle Background Notifications
messaging.onBackgroundMessage((payload) => {
    console.log("Background Notification Received:", payload);
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.image
    });
});
