// firebase-config.js

// 1) استيراد دوال Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 2) إعدادات مشروع Firebase (غيّر القيم إذا تغيّرت في لوحة تحكم Firebase لديك)
const firebaseConfig = {
  apiKey: "AIzaSyBinpejpZQv71xxhJrlYcET-uNLPL0pROY",
  authDomain: "ynmo-center-scheduler.firebaseapp.com",
  databaseURL: "https://ynmo-center-scheduler-default-rtdb.firebaseio.com",
  projectId: "ynmo-center-scheduler",
  storageBucket: "ynmo-center-scheduler.firebasestorage.app",
  messagingSenderId: "287665928063",
  appId: "1:287665928063:web:67f6bccd66a25ef0118c4a"
};

// 3) تهيئة تطبيق Firebase
const app = initializeApp(firebaseConfig);

// 4) الحصول على كائن قاعدة البيانات (Realtime Database)
export const db = getDatabase(app);
