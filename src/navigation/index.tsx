import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, AuthStackParamList, MainTabParamList, OrdersStackParamList } from './types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import CreateOrderScreen from '../screens/orders/CreateOrderScreen';
import EditOrderScreen from '../screens/orders/EditOrderScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();

// Navegación para autenticación
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Navegación para pedidos
const OrdersNavigator = () => (
  <OrdersStack.Navigator>
    <OrdersStack.Screen 
      name="OrdersList" 
      component={OrdersScreen} 
      options={{ title: 'Pedidos' }}
    />
    <OrdersStack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen} 
      options={{ title: 'Detalle de Pedido' }}
    />
    <OrdersStack.Screen 
      name="EditOrder" 
      component={EditOrderScreen} 
      options={{ title: 'Editar Pedido' }}
    />
  </OrdersStack.Navigator>
);

// Navegación principal con tabs
const MainNavigator = () => (
  <MainTab.Navigator 
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

        if (route.name === 'Orders') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'CreateOrder') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3b82f6',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <MainTab.Screen 
      name="Orders" 
      component={OrdersNavigator} 
      options={{ headerShown: false, title: 'Pedidos' }}
    />
    <MainTab.Screen 
      name="CreateOrder" 
      component={CreateOrderScreen} 
      options={{ title: 'Crear Pedido' }}
    />
    <MainTab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ title: 'Perfil' }}
    />
  </MainTab.Navigator>
);

// Navegador raíz que controla la autenticación
export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Aquí podríamos mostrar una pantalla de carga
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
