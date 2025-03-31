import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Order } from '../types';

// Tipos para la navegación de autenticación
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tipos para la navegación principal
export type MainTabParamList = {
  Orders: undefined;
  CreateOrder: undefined;
  Profile: undefined;
  Admin?: undefined;
};

// Tipos para la navegación de pedidos
export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string };
  EditOrder: { order: Order };
};

// Tipos para la navegación administrativa
export type AdminStackParamList = {
  ProductsAdmin: undefined;
};

// Tipos para la navegación raíz
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Tipo para las propiedades de pantalla de Auth
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

// Tipo para las propiedades de pantalla de Main
export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

// Tipo para las propiedades de pantalla de Orders
export type OrdersScreenProps<T extends keyof OrdersStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<OrdersStackParamList, T>,
    MainTabScreenProps<'Orders'>
  >;

// Tipo para las propiedades de pantalla de Admin
export type AdminScreenProps<T extends keyof AdminStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<AdminStackParamList, T>,
    MainTabScreenProps<'Admin'>
  >;
