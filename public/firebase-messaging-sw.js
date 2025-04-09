// Firebase Cloud Messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDrc2lwANMjFSGzYoOqCoqkvecP1UShZ9Y',
  authDomain: 'receipt-scanner-app1.firebaseapp.com',
  projectId: 'receipt-scanner-app1',
  storageBucket: 'receipt-scanner-app1.appspot.com',
  messagingSenderId: '792383326566',
  appId: '1:792383326566:web:10270d569b3e72e48be0a7'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});