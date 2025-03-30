import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implementar función de registro con Firebase
      console.log('Registro con:', displayName, email, password);
      // Simulación temporal de registro exitoso
      setTimeout(() => {
        setLoading(false);
        // Redirigir al login después del registro exitoso
        navigation.navigate('Login');
      }, 1000);
    } catch (error) {
      setError('Error al registrar usuario. Por favor intenta de nuevo.');
      setLoading(false);
      console.error(error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6 pt-12">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-center text-blue-600">Panbol</Text>
          <Text className="text-lg text-center text-gray-600">Registro de Usuario</Text>
        </View>

        {error && (
          <View className="mb-4 p-3 bg-red-100 rounded-md">
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-gray-700 mb-2">Nombre</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Ingresa tu nombre completo"
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>

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

        <View className="mb-4">
          <Text className="text-gray-700 mb-2">Contraseña</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2">Confirmar Contraseña</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className={`p-3 rounded-md ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-white text-center font-bold">
            {loading ? 'Registrando...' : 'Registrarse'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="mt-4"
          onPress={() => navigation.navigate('Login')}
        >
          <Text className="text-center text-blue-600">
            ¿Ya tienes una cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
