import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, error: authError, loading: authLoading } = useAuth();
  
  // Mostrar errores de autenticación
  useEffect(() => {
    if (authError && !authLoading) {
      Alert.alert('Error de registro', authError);
    }
  }, [authError, authLoading]);
  
  const handleRegister = async () => {
    // Validaciones
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error de contraseña', 'Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Registrar usuario con Firebase
      await register(email, password, displayName);
      
      // Si llegamos aquí, el registro fue exitoso
      Alert.alert(
        'Registro exitoso', 
        'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
        [
          { 
            text: 'Iniciar sesión', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
    } catch (error) {
      // Los errores específicos ya son manejados por el useEffect que observa authError
      console.error('Error de registro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isSubmitting || authLoading;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6 pt-12">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-center text-blue-600">Panbol</Text>
          <Text className="text-lg text-center text-gray-600">Registro de Usuario</Text>
        </View>

        {authError && !loading && (
          <View className="mb-4 p-3 bg-red-100 rounded-md">
            <Text className="text-red-700">{authError}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-gray-700 mb-2">Nombre</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Ingresa tu nombre completo"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
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
            editable={!loading}
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
            editable={!loading}
          />
          <Text className="text-xs text-gray-500 mt-1">
            La contraseña debe tener al menos 6 caracteres
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2">Confirmar Contraseña</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          className={`p-3 rounded-md ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold">
              Registrarse
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="mt-4"
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text className="text-center text-blue-600">
            ¿Ya tienes una cuenta? Iniciar sesión
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
