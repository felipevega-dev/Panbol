import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Configurar Auth con persistencia según la plataforma
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
  // Establecer persistencia local en web
  setPersistence(auth, browserLocalPersistence);
} else {
  // En dispositivos móviles usar AsyncStorage para persistencia
  // @ts-ignore - La definición de tipo no incluye getReactNativePersistence pero la función existe
  const { getReactNativePersistence } = require('firebase/auth');
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Exportar instancias de Auth y Firestore
export { auth };
export const db = getFirestore(app);
export default app;
