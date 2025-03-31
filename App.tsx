import "./global.css";
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation';
import { AuthProvider } from './src/contexts/AuthContext';
import { OrderProvider } from './src/contexts/OrderContext';

export default function App() {
  return (
    <AuthProvider>
      <OrderProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </OrderProvider>
    </AuthProvider>
  );
}
