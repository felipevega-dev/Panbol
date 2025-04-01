import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { Order } from '../../types';

type Props = OrdersScreenProps<'OrdersList'>;

const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const { orders, loading, getOrders, exportOrdersToCSV, canEditOrder } = useOrders();

  useEffect(() => {
    getOrders();
  }, []);

  const handleExportCSV = async () => {
    if (loading) return;
    
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
    switch (status.toUpperCase()) {
      case 'ENTREGADO':
        return 'bg-green-500';
      case 'CANCELADO':
        return 'bg-red-500';
      case 'PENDIENTE':
      default:
        return 'bg-blue-500';
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return String(dateString);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.estado);
    const isEditable = canEditOrder(item);
    
    return (
      <TouchableOpacity
        className="bg-white mb-3 rounded-lg overflow-hidden shadow-sm"
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View className="p-4 border-l-4 border-blue-500">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800">Pedido #{item.id.substring(0, 8)}</Text>
              <Text className="text-gray-600">Fecha: {formatDate(item.fechaPedido)}</Text>
              <Text className="text-gray-600">Entrega: {formatDate(item.fechaEntrega)}</Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${statusColor}`}>
              <Text className="text-white font-medium">{item.estado}</Text>
            </View>
          </View>
          
          {isEditable && (
            <View className="mt-2">
              <Text className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full self-start">
                Editable hasta las 20:00
              </Text>
            </View>
          )}
          
          {item.esFeriado && (
            <View className="mt-2 flex-row items-center">
              <Ionicons name="calendar" size={16} color="#EF4444" />
              <Text className="ml-1 text-red-500 font-medium">Día Feriado</Text>
            </View>
          )}
          
          {item.observaciones && (
            <View className="mt-2 p-2 bg-gray-100 rounded-md">
              <Text className="text-gray-600 italic">{item.observaciones}</Text>
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
          disabled={loading || orders.length === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="white" />
              <Text className="ml-1 text-white font-medium">Exportar CSV</Text>
            </>
          )}
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
            {!loading && (
              <TouchableOpacity 
                className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
                onPress={() => navigation.navigate('CreateOrder')}
              >
                <Text className="text-white font-medium">Crear Pedido</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate('CreateOrder')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default OrdersScreen;
