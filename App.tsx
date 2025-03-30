import React from 'react';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>¡Bienvenido a Panbol!</Text>
      <Text style={{ marginTop: 8 }}>Aplicación de gestión de pedidos</Text>
    </View>
  );
}
