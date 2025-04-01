import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { User, AuthState } from '../types';
import { 
  loginWithEmail, 
  loginWithGoogle, 
  registerWithEmail, 
  logout as logoutService,
  getCurrentUser 
} from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
          const userData = await getCurrentUser(firebaseUser);
          
          if (userData) {
            setState({
              user: userData,
              loading: false,
              error: null
            });
          } else {
            // Si el usuario está autenticado pero no tiene datos en Firestore
            setState({
              user: null,
              loading: false,
              error: 'No se encontraron datos del usuario'
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
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await loginWithEmail(email, password);
      // El efecto onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error durante el inicio de sesión'
      }));
      throw error; // Re-lanzar para que se maneje en el componente
    }
  };

  const handleGoogleLogin = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await loginWithGoogle();
      // El efecto onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error durante el inicio de sesión con Google'
      }));
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await registerWithEmail(email, password, displayName);
      // El efecto onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error durante el registro'
      }));
      throw error; // Re-lanzar para que se maneje en el componente
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await logoutService();
      // El efecto onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error durante el cierre de sesión'
      }));
      throw error; // Re-lanzar para que se maneje en el componente
    }
  };

  const handleLogout = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await logoutService();
      // El efecto onAuthStateChanged se encargará de actualizar el estado
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error durante el cierre de sesión'
      }));
      throw error; // Re-lanzar para que se maneje en el componente
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        ...state,
        login,
        loginWithGoogle: handleGoogleLogin,
        register,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
