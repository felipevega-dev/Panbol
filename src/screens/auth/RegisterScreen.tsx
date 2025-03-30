import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { register, loading, error } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await register(email, password, displayName);
    } catch (error) {
      // El error ya se maneja en el contexto de autenticación
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
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 mb-2">Contraseña</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Ingresa tu contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2">Confirmar Contraseña</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Confirma tu contraseña"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          className="bg-blue-600 py-3 rounded-md"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">Registrarse</Text>
          )}
        </TouchableOpacity>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-600">¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-blue-600 font-bold">Inicia Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default RegisterScreen;
