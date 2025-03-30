import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
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
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 mb-2">Contraseña</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md"
          placeholder="Ingresa tu contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-md"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold">Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-gray-600">¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text className="text-blue-600 font-bold">Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoginScreen;
