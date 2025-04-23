import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loginWithGoogle, error: authError, loading: authLoading } = useAuth();
  
  // Mostrar errores de autenticación
  useEffect(() => {
    if (authError && !authLoading) {
      Alert.alert('Error de autenticación', authError);
    }
  }, [authError, authLoading]);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu email y contraseña');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      // Si llegamos aquí, el login fue exitoso
      // El AuthContext manejará la redirección a la app principal
    } catch (error) {
      // Errores específicos ya son manejados por el useEffect que observa authError
      console.error('Error de login:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    
    try {
      await loginWithGoogle();
      // Si llegamos aquí, el login fue exitoso
      // El AuthContext manejará la redirección a la app principal
    } catch (error) {
      // Errores específicos ya son manejados por el useEffect que observa authError
      console.error('Error de login con Google:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const loading = isSubmitting || authLoading;
  const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';
  
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-center text-blue-600">Panbol</Text>
          <Text className="text-lg text-center text-gray-600">Gestión de Pedidos</Text>
        </View>
        
        {authError && !loading && (
          <View className="mb-4 p-3 bg-red-100 rounded-md">
            <Text className="text-red-700">{authError}</Text>
          </View>
        )}
        
        <View className="mb-4">
          <Text className="text-gray-700 mb-2">Email</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Ingresa tu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>
        
        <View className="mb-6">
          <Text className="text-gray-700 mb-2">Contraseña</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>
        
        <TouchableOpacity 
          className={`p-3 rounded-md ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">
              Iniciar sesión
            </Text>
          )}
        </TouchableOpacity>
        
        {!isMobile && (
          <>
            <View className="my-4 flex-row items-center">
              <View className="flex-1 h-0.5 bg-gray-200" />
              <Text className="mx-4 text-gray-500">O</Text>
              <View className="flex-1 h-0.5 bg-gray-200" />
            </View>

            <TouchableOpacity 
              className="p-3 rounded-md flex-row justify-center items-center bg-white border border-gray-300"
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text className="text-gray-800 text-center font-medium ml-2">
                Continuar con Google
              </Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity 
          className="mt-6"
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text className="text-center text-blue-600">
            ¿No tienes una cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
