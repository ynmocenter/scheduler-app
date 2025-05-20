// firebase-config.js
// =========================
// تهيئة Firebase الخاصة بمشروعك
// تضمن المفتاح وبيانات المشروع كما زودتنا بها.

// استدعاء الدوال اللازمة من مكتبة Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase }    from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// البيانات التي زودتنا بها:
const firebaseConfig = {
  apiKey: "AIzaSyBinpejpZQv71xxhJrlYcET-uNLPL0pROY",
  authDomain: "ynmo-center-scheduler.firebaseapp.com",
  databaseURL: "https://ynmo-center-scheduler-default-rtdb.firebaseio.com",
  projectId: "ynmo-center-scheduler",
  storageBucket: "ynmo-center-scheduler.firebasestorage.app",
  messagingSenderId: "287665928063",
  appId: "1:287665928063:web:67f6bccd66a25ef0118c4a"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// الحصول على المرجعية لقاعدة البيانات
const db = getDatabase(app);

// نصدر المرجعية للاستخدام في app.js
export { db };
