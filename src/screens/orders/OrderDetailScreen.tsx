import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { OrderWithDetails } from '../../types';
import { exportOrderToCsv } from '../../utils/exportCsv';

// URL de imagen placeholder para productos sin imagen
const placeholderImage = 'https://via.placeholder.com/150/CCCCCC/888888?text=Sin+Imagen';

type Props = OrdersScreenProps<'OrderDetail'>;

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { getOrderDetails, canEditOrder, removeOrder, selectedOrder, loading } = useOrders();

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      await getOrderDetails(orderId);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el detalle del pedido');
    }
  };

  const handleEditOrder = () => {
    if (selectedOrder) {
      navigation.navigate('EditOrder', { order: selectedOrder });
    }
  };

  const handleDeleteOrder = async () => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeOrder(orderId);
              Alert.alert('Éxito', 'El pedido ha sido eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                'No se pudo eliminar el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido')
              );
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = () => {
    if (!selectedOrder) {
      Alert.alert('Error', 'No hay datos de pedido para exportar');
      return;
    }
    
    if (Platform.OS !== 'web') {
      Alert.alert('Exportación CSV', 'La exportación a CSV solo está disponible en la versión web.');
      return;
    }
    
    try {
      const success = exportOrderToCsv(selectedOrder);
      
      if (success) {
        Alert.alert('Éxito', 'El pedido ha sido exportado a CSV correctamente');
      } else {
        Alert.alert('Error', 'No se pudo exportar el pedido a CSV');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al exportar a CSV');
      console.error(error);
    }
  };

  if (loading || !selectedOrder) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-2 text-gray-600">Cargando detalles del pedido...</Text>
      </View>
    );
  }

  const isEditable = canEditOrder(selectedOrder);
  const totalItems = selectedOrder.productos.reduce((sum, p) => sum + p.cantidad, 0);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Pedido #{selectedOrder.id.substring(0, 8)}</Text>
        <View className="flex-row items-center mt-1">
          <View className={`h-2 w-2 rounded-full mr-2 ${selectedOrder.estado === 'PENDIENTE' ? 'bg-orange-500' : selectedOrder.estado === 'ENTREGADO' ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="text-gray-600">{selectedOrder.estado}</Text>
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row justify-between mb-4">
          {isEditable && (
            <TouchableOpacity 
              className="bg-blue-500 py-2 px-4 rounded-md flex-row items-center"
              onPress={handleEditOrder}
            >
              <Ionicons name="create-outline" size={20} color="white" className="mr-1" />
              <Text className="text-white font-bold">Editar</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            className="bg-red-500 py-2 px-4 rounded-md flex-row items-center"
            onPress={handleDeleteOrder}
          >
            <Ionicons name="trash-outline" size={20} color="white" className="mr-1" />
            <Text className="text-white font-bold">Eliminar</Text>
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <TouchableOpacity 
              className="bg-green-500 py-2 px-4 rounded-md flex-row items-center"
              onPress={handleExportCSV}
            >
              <Ionicons name="download-outline" size={20} color="white" className="mr-1" />
              <Text className="text-white font-bold">Exportar CSV</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Detalles del Pedido</Text>
          
          <View className="flex-row mb-2">
            <Text className="text-gray-600 font-medium w-1/3">Fecha de Pedido:</Text>
            <Text className="text-gray-800">{format(new Date(selectedOrder.fechaPedido), 'dd/MM/yyyy', { locale: es })}</Text>
          </View>
          
          <View className="flex-row mb-2">
            <Text className="text-gray-600 font-medium w-1/3">Fecha de Entrega:</Text>
            <Text className="text-gray-800">{format(new Date(selectedOrder.fechaEntrega), 'dd/MM/yyyy', { locale: es })}</Text>
          </View>
          
          <View className="flex-row mb-2">
            <Text className="text-gray-600 font-medium w-1/3">Es Feriado:</Text>
            <Text className="text-gray-800">{selectedOrder.esFeriado ? 'Sí' : 'No'}</Text>
          </View>
          
          {selectedOrder.observaciones && (
            <View className="mb-2">
              <Text className="text-gray-600 font-medium">Observaciones:</Text>
              <Text className="text-gray-800 mt-1 p-2 bg-gray-50 rounded">{selectedOrder.observaciones}</Text>
            </View>
          )}
        </View>

        <Text className="text-lg font-bold text-gray-800 mb-2">Productos ({totalItems})</Text>
        
        {selectedOrder.productos.map((product) => (
          <View 
            key={product.id} 
            className="flex-row items-center bg-white p-3 rounded-lg shadow-sm mb-2"
          >
            <Image 
              source={{ uri: product.imagen || placeholderImage }} 
              className="w-16 h-16 rounded mr-3"
              defaultSource={{ uri: placeholderImage }}
            />
            
            <View className="flex-1">
              <Text className="font-bold text-gray-800">{product.producto}</Text>
              <Text className="text-gray-500">{product.categoria}</Text>
              <Text className="text-gray-700 font-medium">Cantidad: {product.cantidad}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default OrderDetailScreen;
