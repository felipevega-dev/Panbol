import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { OrderWithDetails, OrderStatus } from '../../types';
import { printOrderToPdf } from '../../utils/exportPrint';
import { exportOrderToExcel } from '../../utils/exportExcel';

// URL de imagen placeholder para productos sin imagen
const placeholderImage = 'https://via.placeholder.com/150/CCCCCC/888888?text=Sin+Imagen';

type Props = OrdersScreenProps<'OrderDetail'>;

const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { getOrderDetails, canEditOrder, removeOrder, selectedOrder, loading, updateOrderStatus } = useOrders();
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [changeStatusLoading, setChangeStatusLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

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

  const handleExportPDF = async () => {
    if (!selectedOrder) {
      Alert.alert('Error', 'No hay datos de pedido para exportar');
      return;
    }
    
    setExportLoading(true);
    setShowExportOptions(false);
    
    try {
      const result = await printOrderToPdf(selectedOrder);
      
      if (result) {
        Alert.alert('Éxito', 'El pedido ha sido exportado a PDF correctamente');
      } else {
        Alert.alert('Error', 'No se pudo exportar el pedido a PDF');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al exportar a PDF');
      console.error(error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedOrder) {
      Alert.alert('Error', 'No hay datos de pedido para exportar');
      return;
    }
    
    setExportLoading(true);
    setShowExportOptions(false);
    
    try {
      const result = await exportOrderToExcel(selectedOrder);
      
      if (result) {
        if (Platform.OS === 'web') {
          Alert.alert('Éxito', 'El pedido ha sido exportado a Excel correctamente');
        }
        // En móviles no es necesario mostrar una alerta porque el sistema ya muestra un diálogo de compartir
      } else {
        Alert.alert('Error', 'No se pudo exportar el pedido a Excel');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al exportar a Excel');
      console.error(error);
    } finally {
      setExportLoading(false);
    }
  };

  const toggleExportOptions = () => {
    setShowExportOptions(!showExportOptions);
  };

  const handleChangeStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    
    setChangeStatusLoading(true);
    setShowStatusModal(false);
    
    try {
      await updateOrderStatus(orderId, status);
      Alert.alert('Éxito', `El estado del pedido ha sido cambiado a ${status}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado del pedido');
      console.error(error);
    } finally {
      setChangeStatusLoading(false);
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
        <Text className="text-lg font-bold text-gray-800 mb-3">Acciones</Text>
        
        <View className="flex-row flex-wrap justify-start mb-4 gap-2">
          {isEditable && (
            <TouchableOpacity 
              className="bg-blue-500 py-2 px-4 rounded-md flex-row items-center"
              onPress={handleEditOrder}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text className="text-white font-bold ml-1">Editar</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            className="bg-red-500 py-2 px-4 rounded-md flex-row items-center"
            onPress={handleDeleteOrder}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text className="text-white font-bold ml-1">Eliminar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-green-600 py-2 px-4 rounded-md flex-row items-center"
            onPress={toggleExportOptions}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="white" />
                <Text className="text-white font-bold ml-1">Exportar</Text>
                <Ionicons 
                  name={showExportOptions ? "chevron-up-outline" : "chevron-down-outline"} 
                  size={16} 
                  color="white" 
                  style={{ marginLeft: 4 }}
                />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-purple-500 py-2 px-4 rounded-md flex-row items-center"
            onPress={() => setShowStatusModal(true)}
            disabled={changeStatusLoading}
          >
            {changeStatusLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="white" />
                <Text className="text-white font-bold ml-1">Cambiar Estado</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Opciones de exportación */}
        {showExportOptions && (
          <View className="bg-white rounded-lg shadow-sm p-2 mb-4">
            <TouchableOpacity 
              className="py-2 px-3 flex-row items-center border-b border-gray-100"
              onPress={handleExportExcel}
            >
              <Ionicons name="document-outline" size={20} color="#16a34a" />
              <Text className="ml-2 text-gray-800">Exportar a Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-2 px-3 flex-row items-center"
              onPress={handleExportPDF}
            >
              <Ionicons name="document-text-outline" size={20} color="#e11d48" />
              <Text className="ml-2 text-gray-800">Exportar a PDF</Text>
            </TouchableOpacity>
          </View>
        )}

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

      {/* Modal para cambiar estado - Funciona tanto en móvil como en web */}
      {showStatusModal && (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 justify-center items-center z-50">
          <View className="bg-white rounded-lg p-4 w-72">
            <Text className="text-lg font-bold text-center mb-4">Cambiar Estado</Text>
            
            <TouchableOpacity 
              className="py-3 border-b border-gray-200"
              onPress={() => handleChangeStatus('PENDIENTE')}
            >
              <Text className="text-center text-orange-500 font-medium">PENDIENTE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-3 border-b border-gray-200"
              onPress={() => handleChangeStatus('ENTREGADO')}
            >
              <Text className="text-center text-green-500 font-medium">ENTREGADO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="py-3 mb-2"
              onPress={() => handleChangeStatus('CANCELADO')}
            >
              <Text className="text-center text-red-500 font-medium">CANCELADO</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-gray-200 py-2 rounded-md"
              onPress={() => setShowStatusModal(false)}
            >
              <Text className="text-center font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetailScreen;
