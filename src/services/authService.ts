import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

/**
 * Registra un nuevo usuario con email y contraseña
 */
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  try {
    // 1. Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 2. Actualizar el perfil con el nombre
    await updateProfile(firebaseUser, { displayName });
    
    // 3. Crear documento en la colección 'users'
    const userData: Omit<User, 'id'> = {
      email: firebaseUser.email || email,
      displayName: displayName,
      role: 'CLIENTE' // Rol por defecto
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    
    // 4. Retornar el usuario creado
    return {
      id: firebaseUser.uid,
      ...userData
    };
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  }
};

/**
 * Inicia sesión con email y contraseña
 */
export const loginWithEmail = async (
  email: string, 
  password: string
): Promise<User> => {
  try {
    // 1. Iniciar sesión en Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 2. Obtener datos adicionales del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      // Si por alguna razón no existe el documento, crearlo
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email || email,
        displayName: firebaseUser.displayName || 'Usuario',
        role: 'CLIENTE'
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      return {
        id: firebaseUser.uid,
        ...userData
      };
    }
    
    // 3. Retornar el usuario con sus datos
    const userData = userDoc.data() as Omit<User, 'id'>;
    
    return {
      id: firebaseUser.uid,
      ...userData
    };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
};

/**
 * Inicia sesión con Google
 */
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    // Verificar si el usuario ya existe en Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      // Si es primera vez, crear el documento
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario de Google',
        role: 'CLIENTE'
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      
      return {
        id: firebaseUser.uid,
        ...userData
      };
    }
    
    // Si ya existe, retornar sus datos
    const userData = userDoc.data() as Omit<User, 'id'>;
    
    return {
      id: firebaseUser.uid,
      ...userData
    };
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  }
};

/**
 * Cierra la sesión del usuario actual
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

/**
 * Obtiene los datos del usuario actual
 */
export const getCurrentUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data() as Omit<User, 'id'>;
    
    return {
      id: firebaseUser.uid,
      ...userData
    };
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    throw error;
  }
};
