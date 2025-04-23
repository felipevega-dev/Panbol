import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenProps } from '../../navigation/types';

type Props = ProfileScreenProps<'Settings'>;

const SettingsScreen: React.FC<Props> = () => {
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [orderUpdatesEnabled, setOrderUpdatesEnabled] = useState(true);
  
  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">Preferencias de Aplicación</Text>
        
        <View className="bg-white rounded-lg shadow-sm mb-4">
          <View className="p-4 border-b border-gray-200 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="moon-outline" size={22} color="#3B82F6" className="mr-3" />
              <View>
                <Text className="text-gray-800 font-medium">Modo Oscuro</Text>
                <Text className="text-gray-500 text-sm">Cambiar apariencia de la app</Text>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#e5e7eb", true: "#93c5fd" }}
              thumbColor={darkModeEnabled ? "#3b82f6" : "#f4f3f4"}
            />
          </View>
          
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="language-outline" size={22} color="#3B82F6" className="mr-3" />
              <View>
                <Text className="text-gray-800 font-medium">Idioma</Text>
                <Text className="text-gray-500 text-sm">Español</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </View>
        </View>
        
        <Text className="text-lg font-bold text-gray-800 mb-4">Notificaciones</Text>
        
        <View className="bg-white rounded-lg shadow-sm mb-4">
          <View className="p-4 border-b border-gray-200 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={22} color="#3B82F6" className="mr-3" />
              <View>
                <Text className="text-gray-800 font-medium">Notificaciones</Text>
                <Text className="text-gray-500 text-sm">Activar todas las notificaciones</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#e5e7eb", true: "#93c5fd" }}
              thumbColor={notificationsEnabled ? "#3b82f6" : "#f4f3f4"}
            />
          </View>
          
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="cart-outline" size={22} color="#3B82F6" className="mr-3" />
              <View>
                <Text className="text-gray-800 font-medium">Actualizaciones de Pedidos</Text>
                <Text className="text-gray-500 text-sm">Cambios de estado, confirmaciones</Text>
              </View>
            </View>
            <Switch
              value={orderUpdatesEnabled}
              onValueChange={setOrderUpdatesEnabled}
              trackColor={{ false: "#e5e7eb", true: "#93c5fd" }}
              thumbColor={orderUpdatesEnabled ? "#3b82f6" : "#f4f3f4"}
            />
          </View>
        </View>
        
        <Text className="text-lg font-bold text-gray-800 mb-4">Avanzado</Text>
        
        <View className="bg-white rounded-lg shadow-sm mb-4">
          <TouchableOpacity className="p-4 border-b border-gray-200 flex-row items-center">
            <Ionicons name="refresh-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Limpiar caché</Text>
              <Text className="text-gray-500 text-sm">Liberar espacio de almacenamiento</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity className="p-4 flex-row items-center">
            <Ionicons name="lock-closed-outline" size={22} color="#3B82F6" className="mr-3" />
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Seguridad y Privacidad</Text>
              <Text className="text-gray-500 text-sm">Opciones de seguridad</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen; 