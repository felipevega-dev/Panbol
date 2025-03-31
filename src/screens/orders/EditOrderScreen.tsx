import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { ProductWithQuantity, OrderWithDetails } from '../../types';

// URL de imagen placeholder para productos sin imagen
const placeholderImage = 'https://via.placeholder.com/150';

type Props = OrdersScreenProps<'EditOrder'>;

const EditOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { order } = route.params as { order: OrderWithDetails };
  const { updateExistingOrder, loading, canEditOrder } = useOrders();

  // Verificar si el pedido es editable
  useEffect(() => {
    if (!canEditOrder(order)) {
      Alert.alert(
        'No Editable',
        'Este pedido ya no puede ser editado porque ha pasado el límite de tiempo (20:00 del mismo día).',
        [{ text: 'Volver', onPress: () => navigation.goBack() }]
      );
    }
  }, [order, canEditOrder, navigation]);
  
  // Estado para los productos seleccionados
  const [selectedProducts, setSelectedProducts] = useState<ProductWithQuantity[]>(() => {
    return order.productos || [];
  });
  
  // Estado para las fechas
  const [orderDate, setOrderDate] = useState(new Date(order.fechaPedido));
  const [deliveryDate, setDeliveryDate] = useState(new Date(order.fechaEntrega));
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  
  // Estado para observaciones
  const [observations, setObservations] = useState(order.observaciones || '');

  // Cambiar cantidad de un producto
  const changeQuantity = (id: string, amount: number) => {
    setSelectedProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === id 
          ? { ...product, cantidad: Math.max(0, product.cantidad + amount) } 
          : product
      )
    );
  };

  // Manejar cambios en los date pickers
  const onOrderDateChange = (event: any, selectedDate?: Date) => {
    setShowOrderDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setOrderDate(selectedDate);
    }
  };

  const onDeliveryDateChange = (event: any, selectedDate?: Date) => {
    setShowDeliveryDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeliveryDate(selectedDate);
    }
  };

  // Validar y actualizar el pedido
  const handleUpdateOrder = async () => {
    // Filtrar productos con cantidad > 0
    const productsToOrder = selectedProducts.filter(product => product.cantidad > 0);
    
    if (productsToOrder.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un producto');
      return;
    }
    
    try {
      await updateExistingOrder(
        order.id,
        {
          fechaEntrega: deliveryDate,
          observaciones: observations
        },
        productsToOrder
      );
      
      Alert.alert(
        'Pedido Actualizado',
        'Tu pedido ha sido actualizado exitosamente',
        [
          { 
            text: 'Ver Detalles', 
            onPress: () => navigation.navigate('OrderDetail', { orderId: order.id })
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo actualizar el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  };

  // Calcular total del pedido
  const totalAmount = selectedProducts
    .reduce((sum, product) => sum + (product.precio * product.cantidad), 0);
    
  const totalItems = selectedProducts
    .reduce((sum, product) => sum + product.cantidad, 0);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Editar Pedido #{order.id.substring(0, 8)}</Text>
        <Text className="text-gray-600">Modifica los productos o detalles de tu pedido</Text>
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-4">Productos</Text>
        
        {selectedProducts.map((product) => (
          <View 
            key={product.id} 
            className="bg-white rounded-lg shadow-sm p-4 mb-3 flex-row items-center"
          >
            <Image 
              source={{ uri: product.imagen || placeholderImage }} 
              className="w-20 h-20 rounded-md mr-3"
            />
            
            <View className="flex-1">
              <Text className="text-gray-800 font-bold">{product.producto}</Text>
              <Text className="text-gray-600">${product.precio} c/u</Text>
              
              <View className="flex-row items-center mt-2">
                <TouchableOpacity
                  className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center"
                  onPress={() => changeQuantity(product.id, -1)}
                  disabled={product.cantidad <= 0}
                >
                  <Ionicons name="remove" size={18} color="#374151" />
                </TouchableOpacity>
                
                <Text className="mx-4 text-lg font-bold text-gray-800 min-w-[30px] text-center">
                  {product.cantidad}
                </Text>
                
                <TouchableOpacity
                  className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center"
                  onPress={() => changeQuantity(product.id, 1)}
                >
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Detalles del Pedido</Text>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <Text className="text-gray-600 mb-2">Fecha de Pedido</Text>
          <View className="border border-gray-300 p-3 rounded-md flex-row justify-between items-center bg-gray-100">
            <Text>{format(orderDate, 'dd/MM/yyyy')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </View>
          <Text className="text-xs text-gray-500 mt-1">La fecha de pedido no se puede modificar</Text>
        </View>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <Text className="text-gray-600 mb-2">Fecha de Entrega</Text>
          <TouchableOpacity
            className="border border-gray-300 p-3 rounded-md flex-row justify-between items-center"
            onPress={() => setShowDeliveryDatePicker(true)}
          >
            <Text>{format(deliveryDate, 'dd/MM/yyyy')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {showDeliveryDatePicker && (
            <DateTimePicker
              value={deliveryDate}
              mode="date"
              display="default"
              onChange={onDeliveryDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <Text className="text-gray-600 mb-2">Observaciones</Text>
          <TextInput
            className="border border-gray-300 p-3 rounded-md min-h-[100px]"
            value={observations}
            onChangeText={setObservations}
            placeholder="Escribe instrucciones especiales o detalles adicionales aquí..."
            multiline
            textAlignVertical="top"
          />
        </View>

        <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Total de productos:</Text>
            <Text className="text-gray-800 font-bold">{totalItems}</Text>
          </View>
          <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
            <Text className="text-gray-800 font-medium">Total a pagar:</Text>
            <Text className="text-xl text-blue-600 font-bold">${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          className={`p-4 rounded-lg items-center mb-4 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
          onPress={handleUpdateOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold">Guardar Cambios</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          className="p-4 rounded-lg items-center border border-gray-300"
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text className="text-gray-700 font-medium">Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditOrderScreen;
