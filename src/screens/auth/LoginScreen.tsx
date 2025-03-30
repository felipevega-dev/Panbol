import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implementar función de login con Firebase
      console.log('Login con:', email, password);
      // Simulación temporal de login exitoso
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError('Error al iniciar sesión. Por favor intenta de nuevo.');
      setLoading(false);
      console.error(error);
    }
  };
  
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-center text-blue-600">Panbol</Text>
          <Text className="text-lg text-center text-gray-600">Gestión de Pedidos</Text>
        </View>
        
        {error && (
          <View className="mb-4 p-3 bg-red-100 rounded-md">
            <Text className="text-red-700">{error}</Text>
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
          />
        </View>
        
        <TouchableOpacity 
          className={`p-3 rounded-md ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="mt-4"
          onPress={() => navigation.navigate('Register')}
        >
          <Text className="text-center text-blue-600">
            ¿No tienes una cuenta? Regístrate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
