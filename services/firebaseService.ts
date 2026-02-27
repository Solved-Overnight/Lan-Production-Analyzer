
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, remove, push, query, limitToLast, orderByChild } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBqVfchMn025rdctKuhvDsRSUStTbi5ww8",
  authDomain: "lantabur-group.firebaseapp.com",
  databaseURL: "https://lantabur-group-default-rtdb.firebaseio.com",
  projectId: "lantabur-group",
  storageBucket: "lantabur-group.firebasestorage.app",
  messagingSenderId: "231428385364",
  appId: "1:231428385364:web:39b0893303d665f744dbc1",
  measurementId: "G-W06RL7PMXB"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export { ref, onValue, set, remove, push, query, limitToLast, orderByChild };
