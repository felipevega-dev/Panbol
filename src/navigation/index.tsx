import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Importación de tipos
import { 
  RootStackParamList, 
  AuthStackParamList, 
  MainTabParamList,
  OrdersStackParamList
} from './types';

// Importación de pantallas de autenticación
import { LoginScreen, RegisterScreen } from '../screens/auth';

// Pantallas temporales para el desarrollo (se reemplazarán más adelante)
const TemporaryOrdersScreen = () => (
  <View className="flex-1 items-center justify-center bg-white">
    <Text className="text-xl">Pantalla de Pedidos</Text>
  </View>
);

const TemporaryCreateOrderScreen = () => (
  <View className="flex-1 items-center justify-center bg-white">
    <Text className="text-xl">Crear Pedido</Text>
  </View>
);

const TemporaryProfileScreen = () => (
  <View className="flex-1 items-center justify-center bg-white">
    <Text className="text-xl">Perfil de Usuario</Text>
  </View>
);

// Creación de los navegadores
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();

// Navegador de autenticación
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Navegador de pedidos
const OrdersNavigator = () => (
  <OrdersStack.Navigator>
    <OrdersStack.Screen 
      name="OrdersList" 
      component={TemporaryOrdersScreen} 
      options={{ headerTitle: 'Mis Pedidos' }}
    />
  </OrdersStack.Navigator>
);

// Navegador principal con pestañas
const MainNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any;

        if (route.name === 'Orders') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'CreateOrder') {
          iconName = focused ? 'add-circle' : 'add-circle-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3b82f6', // Tailwind blue-500
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
      component={TemporaryCreateOrderScreen} 
      options={{ title: 'Crear Pedido' }}
    />
    <MainTab.Screen 
      name="Profile" 
      component={TemporaryProfileScreen} 
      options={{ title: 'Perfil' }}
    />
  </MainTab.Navigator>
);

// Navegador raíz
export const AppNavigator = () => {
  // Aquí eventualmente verificaremos el estado de autenticación
  const isAuthenticated = false;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
