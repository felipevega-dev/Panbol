import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';

type Props = MainTabScreenProps<'Profile'>;

const ProfileScreen: React.FC<Props> = () => {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo cerrar la sesión: ' + (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="bg-blue-600 p-6 items-center">
        <View className="w-24 h-24 bg-blue-300 rounded-full items-center justify-center mb-4">
          <Ionicons name="person" size={48} color="white" />
        </View>
        <Text className="text-2xl font-bold text-white">{user?.displayName}</Text>
        <Text className="text-white text-opacity-80">{user?.email}</Text>
        <View className="mt-2 px-3 py-1 bg-blue-800 rounded-full">
          <Text className="text-white text-sm">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</Text>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">Mi Cuenta</Text>

        <View className="bg-white rounded-lg shadow-sm mb-4">
          <TouchableOpacity className="p-4 border-b border-gray-200 flex-row items-center">
            <Ionicons name="document-text-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-medium">Mis Pedidos</Text>
              <Text className="text-gray-500 text-sm">Ver historial de pedidos</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 border-b border-gray-200 flex-row items-center">
            <Ionicons name="notifications-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-medium">Notificaciones</Text>
              <Text className="text-gray-500 text-sm">Configurar notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center">
            <Ionicons name="settings-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-medium">Configuración</Text>
              <Text className="text-gray-500 text-sm">Preferencias de la aplicación</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-4">Información</Text>

        <View className="bg-white rounded-lg shadow-sm mb-6">
          <TouchableOpacity className="p-4 border-b border-gray-200 flex-row items-center">
            <Ionicons name="help-circle-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-medium">Ayuda</Text>
              <Text className="text-gray-500 text-sm">Preguntas frecuentes</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center">
            <Ionicons name="information-circle-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-medium">Acerca de</Text>
              <Text className="text-gray-500 text-sm">Versión 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-red-600 py-3 rounded-lg items-center"
          onPress={handleLogout}
          disabled={loading}
        >
          <Text className="text-white font-bold">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
