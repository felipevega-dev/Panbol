import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            
            setState({
              user: {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: userData.displayName,
                role: userData.role || 'user'
              },
              loading: false,
              error: null
            });
          } else {
            // Si el usuario está autenticado pero no tiene un documento,
            // podríamos crear uno predeterminado o manejarlo de otra manera
            setState({
              user: null,
              loading: false,
              error: 'User data not found'
            });
          }
        } else {
          setState({
            user: null,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El useEffect manejará la actualización del estado después de la autenticación
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error during login'
      }));
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;
      
      // Crear un documento de usuario en Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        displayName,
        role: 'user', // Por defecto, todos los usuarios nuevos son "user"
        createdAt: new Date().toISOString()
      });
      
      // El useEffect manejará la actualización del estado después de la autenticación
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error during registration'
      }));
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signOut(auth);
      // El useEffect manejará la actualización del estado después del cierre de sesión
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error during logout'
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
