import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { Order } from '../../types';

type Props = OrdersScreenProps<'OrdersList'>;

const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const { orders, loading, getOrders, exportOrdersToCSV } = useOrders();

  useEffect(() => {
    getOrders();
  }, []);

  const handleExportCSV = async () => {
    try {
      const filePath = await exportOrdersToCSV();
      Alert.alert(
        'Exportación exitosa',
        `Los pedidos han sido exportados a: ${filePath}`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron exportar los pedidos: ' + (error instanceof Error ? error.message : 'Error desconocido')
      );
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const totalProducts = item.products.reduce((sum, product) => sum + product.quantity, 0);
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        className="bg-white mb-3 rounded-lg overflow-hidden shadow-sm"
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View className="p-4 border-l-4 border-blue-500">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">Pedido #{item.id.substring(0, 8)}</Text>
              <Text className="text-gray-600">Fecha: {formatDate(item.orderDate)}</Text>
              <Text className="text-gray-600">Entrega: {formatDate(item.deliveryDate)}</Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${statusColor}`}>
              <Text className="text-white font-medium">{item.status}</Text>
            </View>
          </View>
          
          <View className="mt-2 flex-row items-center">
            <Ionicons name="cube-outline" size={16} color="#6B7280" />
            <Text className="ml-1 text-gray-600">{totalProducts} productos</Text>
          </View>
          
          {item.observations && (
            <View className="mt-2 p-2 bg-gray-100 rounded-md">
              <Text className="text-gray-600 italic">{item.observations}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <View className="p-4 flex-row justify-between items-center bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Mis Pedidos</Text>
        <TouchableOpacity
          className="flex-row items-center bg-blue-600 px-3 py-2 rounded-lg"
          onPress={handleExportCSV}
        >
          <Ionicons name="download-outline" size={18} color="white" />
          <Text className="ml-1 text-white font-medium">Exportar CSV</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        className="p-4"
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={getOrders} />
        }
        ListEmptyComponent={
          <View className="py-8 items-center">
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text className="mt-2 text-gray-500 text-lg">No hay pedidos disponibles</Text>
          </View>
        }
      />
    </View>
  );
};

export default OrdersScreen;
