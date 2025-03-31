import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Switch,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { OrdersScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { ProductWithQuantity, OrderWithDetails } from '../../types';
import CustomDatePicker from '../../components/CustomDatePicker';

// URL de imagen placeholder para productos sin imagen
const placeholderImage = 'https://via.placeholder.com/150';

type Props = OrdersScreenProps<'EditOrder'>;

const EditOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { order } = route.params as { order: OrderWithDetails };
  const { updateExistingOrder, loading, canEditOrder } = useOrders();

  // Verificar si el pedido es editable
  const isEditable = canEditOrder(order);

  // Estado para las fechas y observaciones
  const [deliveryDate, setDeliveryDate] = useState<Date>(
    order.fechaEntrega instanceof Date 
      ? order.fechaEntrega 
      : new Date(order.fechaEntrega)
  );
  const [observations, setObservations] = useState(order.observaciones || '');
  const [isHoliday, setIsHoliday] = useState(order.esFeriado || false);
  
  // Productos seleccionados
  const [selectedProducts, setSelectedProducts] = useState<ProductWithQuantity[]>(
    order.productos || []
  );

  // Mostrar mensaje si el pedido no es editable
  useEffect(() => {
    if (!isEditable) {
      Alert.alert(
        'No se puede editar',
        'Este pedido ya no puede ser editado porque ha pasado la hora límite (20:00) o ya ha sido entregado.'
      );
    }
  }, [isEditable]);

  // Incrementar cantidad de un producto
  const incrementQuantity = (productId: string) => {
    if (!isEditable) return;
    
    setSelectedProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, cantidad: product.cantidad + 1 } 
          : product
      )
    );
  };

  // Decrementar cantidad de un producto
  const decrementQuantity = (productId: string) => {
    if (!isEditable) return;
    
    setSelectedProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId && product.cantidad > 0
          ? { ...product, cantidad: product.cantidad - 1 } 
          : product
      ).filter(product => product.id !== productId || product.cantidad > 0)
    );
  };

  // Remover un producto
  const removeProduct = (productId: string) => {
    if (!isEditable) return;
    
    Alert.alert(
      'Confirmar',
      '¿Estás seguro que deseas eliminar este producto del pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: () => {
            setSelectedProducts(prevProducts => 
              prevProducts.filter(product => product.id !== productId)
            );
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Actualizar pedido
  const handleUpdateOrder = async () => {
    if (!isEditable) {
      return Alert.alert(
        'No se puede actualizar',
        'Este pedido ya no puede ser editado.'
      );
    }

    if (selectedProducts.length === 0) {
      return Alert.alert(
        'Error',
        'Debes seleccionar al menos un producto.'
      );
    }

    try {
      await updateExistingOrder(
        order.id,
        {
          fechaEntrega: deliveryDate,
          observaciones: observations,
          esFeriado: isHoliday
        },
        selectedProducts
      );

      Alert.alert(
        'Pedido Actualizado',
        'Tu pedido ha sido actualizado correctamente.',
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
            className="flex-row items-center p-3 bg-white rounded-lg shadow-sm mb-2"
          >
            <Image 
              source={{ uri: product.imagen || placeholderImage }} 
              className="w-16 h-16 rounded mr-3"
              defaultSource={{ uri: placeholderImage }}
            />
            
            <View className="flex-1">
              <Text className="font-bold text-gray-800">{product.producto}</Text>
              <Text className="text-gray-500">{product.categoria}</Text>
              {/* Comentado el precio según los requerimientos del jefe */}
              {/* <Text className="text-gray-700">${product.precio.toFixed(2)}</Text> */}
            </View>
            
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => decrementQuantity(product.id)}
                disabled={!isEditable}
                className={`p-2 ${!isEditable ? 'opacity-50' : ''}`}
              >
                <Ionicons name="remove-circle-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <Text className="mx-2 text-gray-800 min-w-8 text-center">
                {product.cantidad}
              </Text>
              
              <TouchableOpacity
                onPress={() => incrementQuantity(product.id)}
                disabled={!isEditable}
                className={`p-2 ${!isEditable ? 'opacity-50' : ''}`}
              >
                <Ionicons name="add-circle-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => removeProduct(product.id)}
                disabled={!isEditable}
                className={`ml-2 p-2 ${!isEditable ? 'opacity-50' : ''}`}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {selectedProducts.length === 0 && (
          <View className="bg-white p-4 rounded-lg shadow-sm items-center">
            <Text className="text-gray-500">No hay productos seleccionados</Text>
          </View>
        )}
        
        <View className="mt-6 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">Detalles del Pedido</Text>
          
          <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
            <Text className="text-gray-600 mb-2">Fecha de Entrega</Text>
            <CustomDatePicker 
              date={deliveryDate}
              onDateChange={setDeliveryDate}
              minimumDate={new Date()}
              disabled={!isEditable}
            />
          </View>
          
          <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
            <Text className="text-gray-600 mb-2">Observaciones</Text>
            <TextInput
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={3}
              className={`border border-gray-300 p-2 rounded-md ${!isEditable ? 'bg-gray-100 text-gray-500' : ''}`}
              placeholder="Instrucciones especiales o comentarios..."
              editable={isEditable}
            />
          </View>
          
          <View className="bg-white rounded-lg shadow-sm p-4 mb-3 flex-row justify-between items-center">
            <Text className="text-gray-600">Es día feriado</Text>
            <Switch
              value={isHoliday}
              onValueChange={setIsHoliday}
              disabled={!isEditable}
            />
          </View>
        </View>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Cantidad de productos:</Text>
            <Text className="font-bold">{totalItems}</Text>
          </View>
          
          {/* Comentado el precio total según los requerimientos del jefe */}
          {/* <View className="flex-row justify-between">
            <Text className="text-gray-600">Total:</Text>
            <Text className="font-bold">${totalAmount.toFixed(2)}</Text>
          </View> */}
        </View>
        
        <TouchableOpacity
          onPress={handleUpdateOrder}
          disabled={!isEditable || loading}
          className={`py-3 rounded-lg ${isEditable ? 'bg-blue-500' : 'bg-gray-400'}`}
        >
          <Text className="text-white font-bold text-center">
            {loading ? 'Actualizando...' : 'Actualizar Pedido'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditOrderScreen;
