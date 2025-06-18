import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase }   from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBinpejpZQv71xxhJrlYcET-uNLPL0pROY",
  authDomain: "ynmo-center-scheduler.firebaseapp.com",
  databaseURL: "https://ynmo-center-scheduler-default-rtdb.firebaseio.com",
  projectId: "ynmo-center-scheduler",
  storageBucket: "ynmo-center-scheduler.firebasestorage.app",
  messagingSenderId: "287665928063",
  appId: "1:287665928063:web:67f6bccd66a25ef0118c4a"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
