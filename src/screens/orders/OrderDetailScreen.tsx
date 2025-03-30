import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { Order } from '../../types';

type Props = OrdersScreenProps<'OrderDetail'>;

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { getOrderById, isEditable, deleteOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el detalle del pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = () => {
    if (order) {
      navigation.navigate('EditOrder', { order });
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
              await deleteOrder(orderId);
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'canceled':
        return 'bg-red-500';
      case 'processing':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Cargando detalle del pedido...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 p-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="mt-4 text-gray-800 text-lg font-bold">Pedido no encontrado</Text>
        <Text className="mt-2 text-gray-600 text-center">
          No se pudo encontrar el pedido solicitado. Puede que haya sido eliminado o no tengas permisos para verlo.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-blue-600 px-4 py-2 rounded-lg"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-medium">Volver a la lista</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canEdit = isEditable(order);
  const totalAmount = order.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="bg-white p-4 mb-4 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-800">Pedido #{order.id.substring(0, 8)}</Text>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
            <Text className="text-white font-medium">{order.status}</Text>
          </View>
        </View>

        <View className="mt-4 flex-row justify-between">
          <View>
            <Text className="text-gray-500">Fecha Pedido</Text>
            <Text className="text-gray-800 font-medium">{formatDate(order.orderDate)}</Text>
          </View>
          <View>
            <Text className="text-gray-500">Fecha Entrega</Text>
            <Text className="text-gray-800 font-medium">{formatDate(order.deliveryDate)}</Text>
          </View>
        </View>
      </View>

      <View className="bg-white p-4 mb-4 shadow-sm">
        <Text className="text-xl font-bold text-gray-800 mb-4">Productos</Text>
        {order.products.map((product, index) => (
          <View 
            key={`${product.id}-${index}`}
            className="flex-row justify-between items-center py-3 border-b border-gray-200"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-gray-200 rounded-md items-center justify-center mr-3">
                <Ionicons name="cube-outline" size={24} color="#6B7280" />
              </View>
              <View>
                <Text className="text-gray-800 font-medium">{product.name}</Text>
                <Text className="text-gray-500">${product.price.toFixed(2)}</Text>
              </View>
            </View>
            <Text className="text-gray-800 font-medium">x{product.quantity}</Text>
          </View>
        ))}
        
        <View className="mt-4 pt-4 border-t border-gray-200">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="text-gray-800 font-bold">${totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {order.observations && (
        <View className="bg-white p-4 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-800 mb-2">Observaciones</Text>
          <Text className="text-gray-600">{order.observations}</Text>
        </View>
      )}

      <View className="p-4 flex-row justify-between">
        {canEdit ? (
          <TouchableOpacity
            className="bg-blue-600 flex-1 py-3 rounded-lg items-center mr-2"
            onPress={handleEditOrder}
          >
            <Text className="text-white font-bold">Editar Pedido</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-300 flex-1 py-3 rounded-lg items-center mr-2">
            <Text className="text-gray-600 font-bold">No Editable</Text>
          </View>
        )}
        
        <TouchableOpacity
          className="bg-red-600 flex-1 py-3 rounded-lg items-center ml-2"
          onPress={handleDeleteOrder}
        >
          <Text className="text-white font-bold">Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default OrderDetailScreen;
