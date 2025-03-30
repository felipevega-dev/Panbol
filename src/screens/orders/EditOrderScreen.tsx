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
import { Product } from '../../types';
import { PREDEFINED_PRODUCTS } from '../../constants/products';

type Props = OrdersScreenProps<'EditOrder'>;

const EditOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { order } = route.params;
  const { updateOrder, loading, isEditable } = useOrders();

  // Verificar si el pedido es editable
  useEffect(() => {
    if (!isEditable(order)) {
      Alert.alert(
        'No Editable',
        'Este pedido ya no puede ser editado porque ha pasado el límite de tiempo (20:00 del mismo día).',
        [{ text: 'Volver', onPress: () => navigation.goBack() }]
      );
    }
  }, [order, isEditable, navigation]);
  
  // Estado para los productos seleccionados
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(() => {
    // Combinar productos predefinidos con los del pedido actual
    const productMap = new Map<string, Product>();
    
    // Inicializar con todos los productos predefinidos con cantidad 0
    PREDEFINED_PRODUCTS.forEach(product => {
      productMap.set(product.id, { ...product, quantity: 0 });
    });
    
    // Actualizar con las cantidades del pedido actual
    order.products.forEach(product => {
      if (productMap.has(product.id)) {
        productMap.set(product.id, { ...product });
      } else {
        // Para productos que estaban en el pedido pero ya no están en los predefinidos
        productMap.set(product.id, product);
      }
    });
    
    return Array.from(productMap.values());
  });
  
  // Estado para las fechas
  const [orderDate, setOrderDate] = useState(new Date(order.orderDate));
  const [deliveryDate, setDeliveryDate] = useState(new Date(order.deliveryDate));
  const [showOrderDatePicker, setShowOrderDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  
  // Estado para observaciones
  const [observations, setObservations] = useState(order.observations);

  // Cambiar cantidad de un producto
  const changeQuantity = (id: string, amount: number) => {
    setSelectedProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === id 
          ? { ...product, quantity: Math.max(0, product.quantity + amount) } 
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
    const productsToOrder = selectedProducts.filter(product => product.quantity > 0);
    
    if (productsToOrder.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un producto');
      return;
    }
    
    if (deliveryDate < orderDate) {
      Alert.alert('Error', 'La fecha de entrega no puede ser anterior a la fecha del pedido');
      return;
    }
    
    try {
      await updateOrder(order.id, {
        products: productsToOrder,
        orderDate: orderDate.toISOString(),
        deliveryDate: deliveryDate.toISOString(),
        observations
      });
      
      Alert.alert(
        'Pedido Actualizado',
        'Tu pedido ha sido actualizado exitosamente',
        [
          { 
            text: 'Ver Detalle', 
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
    .reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
  const totalItems = selectedProducts
    .reduce((sum, product) => sum + product.quantity, 0);

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Editar Pedido</Text>
        <Text className="text-gray-600">Pedido #{order.id.substring(0, 8)}</Text>
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Productos</Text>

        {selectedProducts.map((product) => (
          <View 
            key={product.id} 
            className="bg-white rounded-lg shadow-sm p-4 mb-3 flex-row items-center"
          >
            <Image 
              source={{ uri: product.image }} 
              className="w-20 h-20 rounded-md mr-3"
              defaultSource={require('../../assets/product-placeholder.png')}
            />
            
            <View className="flex-1">
              <Text className="text-gray-800 font-bold">{product.name}</Text>
              <Text className="text-gray-600">${product.price} c/u</Text>
              
              <View className="flex-row items-center mt-2">
                <TouchableOpacity
                  className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center"
                  onPress={() => changeQuantity(product.id, -1)}
                  disabled={product.quantity <= 0 || !isEditable(order)}
                >
                  <Ionicons name="remove" size={18} color="#374151" />
                </TouchableOpacity>
                
                <Text className="mx-4 text-lg font-bold text-gray-800 min-w-[30px] text-center">
                  {product.quantity}
                </Text>
                
                <TouchableOpacity
                  className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center"
                  onPress={() => changeQuantity(product.id, 1)}
                  disabled={!isEditable(order)}
                >
                  <Ionicons name="add" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Fechas</Text>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <Text className="text-gray-600 mb-2">Fecha del Pedido</Text>
          <TouchableOpacity
            className="border border-gray-300 p-3 rounded-md flex-row justify-between items-center"
            onPress={() => setShowOrderDatePicker(true)}
            disabled={!isEditable(order)}
          >
            <Text>{format(orderDate, 'dd/MM/yyyy')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {showOrderDatePicker && (
            <DateTimePicker
              value={orderDate}
              mode="date"
              display="default"
              onChange={onOrderDateChange}
            />
          )}
        </View>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <Text className="text-gray-600 mb-2">Fecha de Entrega</Text>
          <TouchableOpacity
            className="border border-gray-300 p-3 rounded-md flex-row justify-between items-center"
            onPress={() => setShowDeliveryDatePicker(true)}
            disabled={!isEditable(order)}
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
            />
          )}
        </View>
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Observaciones</Text>
        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <TextInput
            className="border border-gray-300 p-3 rounded-md"
            placeholder="Especifica cualquier detalle adicional sobre el pedido"
            multiline
            numberOfLines={4}
            value={observations}
            onChangeText={setObservations}
            textAlignVertical="top"
            editable={isEditable(order)}
          />
        </View>
      </View>

      <View className="bg-white p-4 shadow-sm">
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-600">Total Productos:</Text>
          <Text className="text-gray-800 font-bold">{totalItems}</Text>
        </View>
        
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-600">Total a Pagar:</Text>
          <Text className="text-gray-800 font-bold">${totalAmount.toFixed(2)}</Text>
        </View>
        
        {isEditable(order) ? (
          <TouchableOpacity
            className="bg-blue-600 py-3 rounded-lg items-center"
            onPress={handleUpdateOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Actualizar Pedido</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-300 py-3 rounded-lg items-center">
            <Text className="text-gray-600 font-bold">No Editable</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default EditOrderScreen;
