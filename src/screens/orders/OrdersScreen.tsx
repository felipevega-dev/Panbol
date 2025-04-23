import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Platform, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from 'react-native-paper';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { Order } from '../../types';

type Props = OrdersScreenProps<'OrdersList'>;

// Opciones de ordenamiento
enum SortOptions {
  DATE_DESC = 'Más recientes',
  DATE_ASC = 'Más antiguos',
  STATUS = 'Por estado',
  LAST_EDITED = 'Último editado'
}

interface FilterOptions {
  onlyEdited: boolean;
  onlyHolidays: boolean;
}

const isUpdated = (order: Order) => {
  // Si el pedido tiene fechas de creación y actualización
  if (order.createdAt && order.updatedAt) {
    const createdDate = new Date(order.createdAt).getTime();
    const updatedDate = new Date(order.updatedAt).getTime();
    
    // Si la diferencia es mayor a 1 minuto (60000 ms), consideramos que fue editado
    // Esto evita que se muestre "Editado" para pedidos recién creados
    return (updatedDate - createdDate) > 60000;
  }
  return false;
};

const OrdersScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orders, loading, getOrders, exportOrdersToExcel, canEditOrder } = useOrders();
  const flatListRef = useRef<FlatList>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estado para ordenamiento y paginación
  const [sortOption, setSortOption] = useState<SortOptions>(SortOptions.DATE_DESC);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    onlyEdited: false,
    onlyHolidays: false
  });
  const [showFilters, setShowFilters] = useState(false);

  // Ordenar pedidos según la opción seleccionada
  const sortedOrders = React.useMemo(() => {
    let result = [...orders];
    
    // Aplicar filtros
    if (filters.onlyEdited) {
      result = result.filter(order => isUpdated(order));
    }
    if (filters.onlyHolidays) {
      result = result.filter(order => order.esFeriado);
    }
    
    switch (sortOption) {
      case SortOptions.DATE_DESC:
        return result.sort((a, b) => {
          const dateA = new Date(a.fechaPedido).getTime();
          const dateB = new Date(b.fechaPedido).getTime();
          return dateB - dateA;
        });
      
      case SortOptions.DATE_ASC:
        return result.sort((a, b) => {
          const dateA = new Date(a.fechaPedido).getTime();
          const dateB = new Date(b.fechaPedido).getTime();
          return dateA - dateB;
        });
        
      case SortOptions.STATUS:
        return result.sort((a, b) => {
          const getStatusPriority = (status: string) => {
            switch (status.toUpperCase()) {
              case 'PENDIENTE': return 0;
              case 'ENTREGADO': return 1;
              case 'CANCELADO': return 2;
              default: return 3;
            }
          };
          return getStatusPriority(a.estado) - getStatusPriority(b.estado);
        });

      case SortOptions.LAST_EDITED:
        return result.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });
        
      default:
        return result;
    }
  }, [orders, sortOption, filters]);
  
  // Obtener los pedidos para la página actual
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return sortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedOrders, page, itemsPerPage]);
  
  useEffect(() => {
    getOrders();
  }, []);

  // Efecto para manejar el scroll al pedido editado
  useEffect(() => {
    if (route.params?.editedOrderId && flatListRef.current) {
      const editedOrderIndex = paginatedOrders.findIndex(
        order => order.id === route.params.editedOrderId
      );
      
      if (editedOrderIndex !== -1) {
        flatListRef.current.scrollToIndex({
          index: editedOrderIndex,
          animated: true,
          viewPosition: 0.5
        });
        
        // Mostrar modal de éxito si se solicita
        if (route.params?.showSuccessMessage) {
          setShowSuccessModal(true);
          // Ocultar después de 3 segundos
          setTimeout(() => setShowSuccessModal(false), 3000);
        }
      }
    }
  }, [route.params?.editedOrderId, paginatedOrders]);

  // Cambiar opción de ordenamiento
  const handleSortChange = (option: SortOptions) => {
    setSortOption(option);
    setShowSortOptions(false);
    // Reset a la primera página cuando cambia el ordenamiento
    setPage(1);
  };

  // Calcular número total de páginas
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  const handleExportExcel = async () => {
    if (loading) return;
    
    try {
      const result = await exportOrdersToExcel();
      if (Platform.OS === 'web') {
        Alert.alert(
          'Exportación exitosa',
          'Los pedidos han sido exportados a Excel correctamente'
        );
      } else if (typeof result === 'string') {
        Alert.alert(
          'Exportación exitosa',
          `Los pedidos han sido exportados a: ${result}`
        );
      }
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

  const formatDateTime = (dateString: string | Date) => {
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      return format(date, 'dd/MM/yy HH:mm', { locale: es });
    } catch (error) {
      return String(dateString);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.estado);
    const isEditable = canEditOrder(item);
    const wasEdited = isUpdated(item);
    
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
            <View className="items-end">
              <View className={`px-2 py-1 rounded-full ${statusColor} mb-1`}>
                <Text className="text-white font-medium">{item.estado}</Text>
              </View>
              {/* Mostrar cuándo fue editado el pedido */}
              {wasEdited && (
                <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
                  <Ionicons name="pencil" size={12} color="#92400E" />
                  <Text className="text-xs text-amber-800 ml-1 font-medium">
                    Editado el {formatDateTime(item.updatedAt)}
                  </Text>
                </View>
              )}
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

  // Renderizar controles de paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <View className="flex-row justify-center items-center py-2 bg-white border-t border-gray-200">
        <TouchableOpacity 
          className={`p-2 ${page === 1 ? 'opacity-50' : ''}`}
          disabled={page === 1}
          onPress={() => setPage(p => Math.max(1, p - 1))}
        >
          <Ionicons name="chevron-back" size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        <Text className="px-4 text-gray-700">Página {page} de {totalPages}</Text>
        
        <TouchableOpacity 
          className={`p-2 ${page >= totalPages ? 'opacity-50' : ''}`}
          disabled={page >= totalPages}
          onPress={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    );
  };

  // Renderizar modal de éxito
  const renderSuccessModal = () => (
    <Modal
      transparent={true}
      visible={showSuccessModal}
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-lg shadow-lg p-4 mx-4 max-w-sm">
          <View className="items-center">
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">
              <Ionicons name="checkmark" size={24} color="#22C55E" />
            </View>
            <Text className="text-lg font-bold text-gray-800 mb-1">¡Pedido Actualizado!</Text>
            <Text className="text-gray-600 text-center">
              El pedido ha sido actualizado correctamente
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Calcular altura de cada item para getItemLayout
  const ITEM_HEIGHT = 150; // Ajusta este valor según la altura real de tus items

  // Función para obtener las dimensiones de cada item
  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  // Manejar error de scroll
  const handleScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.5
      });
    });
  };

  return (
    <View className="flex-1 bg-gray-100">
      {renderSuccessModal()}
      <View className="p-4 flex-row justify-between items-center bg-white border-b border-gray-200">
        <View className="flex-row">
          <TouchableOpacity
            className="mr-2 flex-row items-center bg-gray-200 px-3 py-2 rounded-lg"
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="filter-outline" size={18} color="#4b5563" />
            <Text className="ml-1 text-gray-700 font-medium">{sortOption}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mr-2 flex-row items-center bg-gray-200 px-3 py-2 rounded-lg"
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={18} color="#4b5563" />
            <Text className="ml-1 text-gray-700 font-medium">Filtros</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          className="flex-row items-center bg-blue-600 px-3 py-2 rounded-lg"
          onPress={handleExportExcel}
          disabled={loading || orders.length === 0}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="white" />
              <Text className="ml-1 text-white font-medium">Exportar Excel</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Opciones de ordenamiento */}
      {showSortOptions && (
        <View className="absolute top-16 left-4 z-10 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden min-w-[200px]">
          {Object.values(SortOptions).map((option) => (
            <TouchableOpacity 
              key={option}
              className={`px-4 py-3 border-b border-gray-100 ${sortOption === option ? 'bg-blue-50' : ''}`}
              onPress={() => handleSortChange(option as SortOptions)}
            >
              <Text className={`${sortOption === option ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Panel de filtros */}
      {showFilters && (
        <View className="absolute top-16 left-4 z-10 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden min-w-[200px] p-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Filtros</Text>
          <View className="flex-row items-center mb-2">
            <Checkbox
              status={filters.onlyEdited ? 'checked' : 'unchecked'}
              onPress={() => setFilters(prev => ({ ...prev, onlyEdited: !prev.onlyEdited }))}
            />
            <Text className="text-gray-700">Solo pedidos editados</Text>
          </View>
          <View className="flex-row items-center">
            <Checkbox
              status={filters.onlyHolidays ? 'checked' : 'unchecked'}
              onPress={() => setFilters(prev => ({ ...prev, onlyHolidays: !prev.onlyHolidays }))}
            />
            <Text className="text-gray-700">Solo días feriados</Text>
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        className="p-4"
        data={paginatedOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={handleScrollToIndexFailed}
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
        ListFooterComponent={renderPagination}
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
