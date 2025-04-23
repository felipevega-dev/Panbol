import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Importación de tipos
import { 
  RootStackParamList, 
  AuthStackParamList, 
  MainTabParamList,
  OrdersStackParamList,
  AdminStackParamList,
  ProfileStackParamList
} from './types';

// Importación de pantallas de autenticación
import { LoginScreen, RegisterScreen } from '../screens/auth';

// Importación de pantallas de perfil
import { ProfileScreen, SettingsScreen, HelpScreen } from '../screens/profile';

// Importación de pantallas de pedidos
import OrdersScreen from '../screens/orders/OrdersScreen';
import CreateOrderScreen from '../screens/orders/CreateOrderScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import EditOrderScreen from '../screens/orders/EditOrderScreen';

// Importación de pantallas administrativas
import ProductsAdminScreen from '../screens/admin/ProductsAdminScreen';

// Creación de los navegadores
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

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
      component={OrdersScreen} 
      options={{ headerTitle: 'Mis Pedidos' }}
    />
    <OrdersStack.Screen 
      name="OrderDetail" 
      component={OrderDetailScreen} 
      options={({ route }) => ({ 
        headerTitle: `Pedido #${route.params.orderId.substring(0, 8)}` 
      })}
    />
    <OrdersStack.Screen 
      name="EditOrder" 
      component={EditOrderScreen} 
      options={{ headerTitle: 'Editar Pedido' }}
    />
  </OrdersStack.Navigator>
);

// Navegador de administración
const AdminNavigator = () => (
  <AdminStack.Navigator>
    <AdminStack.Screen 
      name="ProductsAdmin" 
      component={ProductsAdminScreen} 
      options={{ headerTitle: 'Administrar Productos' }}
    />
  </AdminStack.Navigator>
);

// Navegador de perfil
const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ headerTitle: 'Mi Perfil' }}
    />
    <ProfileStack.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ headerTitle: 'Configuración' }}
    />
    <ProfileStack.Screen 
      name="Help" 
      component={HelpScreen} 
      options={{ headerTitle: 'Ayuda y Soporte' }}
    />
  </ProfileStack.Navigator>
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
        } else if (route.name === 'Admin') {
          iconName = focused ? 'settings' : 'settings-outline';
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
      component={CreateOrderScreen} 
      options={{ headerShown: false, title: 'Crear Pedido' }}
    />
    <MainTab.Screen 
      name="Profile" 
      component={ProfileNavigator} 
      options={{ headerShown: false, title: 'Perfil' }}
    />
    <MainTab.Screen 
      name="Admin" 
      component={AdminNavigator} 
      options={{ 
        headerShown: false,
        title: 'Administrar', 
      }}
    />
  </MainTab.Navigator>
);

// Navegador raíz
export const AppNavigator = () => {
  // Usar el contexto de autenticación para obtener el estado del usuario
  const { user, loading } = useAuth();
  
  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
