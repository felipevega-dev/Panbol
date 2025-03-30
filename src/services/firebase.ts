import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBe9oC6UZCjavGYu524DQy8naiHGhR4wXY",
  authDomain: "panbol-88342.firebaseapp.com",
  projectId: "panbol-88342",
  storageBucket: "panbol-88342.firebasestorage.app",
  messagingSenderId: "748241497885",
  appId: "1:748241497885:web:7fe3ca19ecf19903593bf4",
  measurementId: "G-1KKCBD3RK5"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias de Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
