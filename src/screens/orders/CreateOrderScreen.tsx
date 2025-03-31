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
  Platform,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { MainTabScreenProps } from '../../navigation/types';
import { useOrders } from '../../contexts/OrderContext';
import { ProductWithQuantity } from '../../types';
import CustomDatePicker from '../../components/CustomDatePicker';

const placeholderImage = 'https://via.placeholder.com/150';

type Props = MainTabScreenProps<'CreateOrder'>;

const CreateOrderScreen: React.FC<Props> = ({ navigation }) => {
  const { createNewOrder, availableProducts, loadAvailableProducts, selectProduct, resetSelectedProducts, loading } = useOrders();
  
  // Cargar productos al montar el componente
  useEffect(() => {
    loadAvailableProducts();
    // Resetear productos al desmontar el componente
    return () => resetSelectedProducts();
  }, []);
  
  // Estado para las fechas
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  
  // Estado para observaciones y día feriado
  const [observations, setObservations] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);

  // Cambiar cantidad de un producto
  const handleQuantityChange = (productId: string, quantity: number) => {
    selectProduct(productId, quantity);
  };

  // Manejar cambios en el date picker
  const onDeliveryDateChange = (selectedDate?: Date) => {
    if (selectedDate) {
      setDeliveryDate(selectedDate);
    }
  };

  // Validar y crear el pedido
  const handleCreateOrder = async () => {
    // Filtrar productos con cantidad > 0
    const productsToOrder = availableProducts.filter(product => product.cantidad > 0);
    
    if (productsToOrder.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un producto');
      return;
    }
    
    try {
      await createNewOrder(
        {
          fechaEntrega: deliveryDate,
          observaciones: observations,
          esFeriado: isHoliday
        },
        productsToOrder
      );
      
      Alert.alert(
        'Pedido Creado',
        'Tu pedido ha sido creado exitosamente',
        [
          { 
            text: 'Ver Pedidos', 
            onPress: () => navigation.navigate('Orders')
          }
        ]
      );
      
      // Resetear el formulario
      resetSelectedProducts();
      setObservations('');
      setDeliveryDate(new Date());
      setIsHoliday(false);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo crear el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido')
      );
    }
  };

  // Calcular total del pedido
  const totalAmount = availableProducts
    .reduce((sum, product) => sum + (product.precio * product.cantidad), 0);
    
  const totalItems = availableProducts
    .reduce((sum, product) => sum + product.cantidad, 0);

  // Agrupar productos por categoría
  const groupedProducts = () => {
    // Obtener todas las categorías únicas
    const categories = [...new Set(availableProducts.map(p => p.categoria))].sort();
    
    // Crear un objeto con las categorías como claves
    return categories.map(category => ({
      category,
      items: availableProducts.filter(p => p.categoria === category).sort((a, b) => 
        a.producto.localeCompare(b.producto)
      )
    }));
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Crear Nuevo Pedido</Text>
        <Text className="text-gray-600">Selecciona productos y especifica cantidades</Text>
      </View>

      {loading && (
        <View className="p-10 items-center justify-center">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text className="mt-2 text-gray-600">Cargando productos...</Text>
        </View>
      )}

      {!loading && (
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Productos Disponibles</Text>
          
          {groupedProducts().map(({ category, items }) => (
            <View key={category} className="mb-4">
              <Text className="text-lg font-bold mb-2 text-gray-700 bg-gray-100 p-2 rounded">
                {category}
              </Text>
              
              <View className={Platform.OS === 'web' ? "grid grid-cols-2 gap-3" : ""}>
                {items.map((product) => (
                  <View 
                    key={product.id} 
                    className="bg-white rounded-lg shadow-sm p-4 mb-3 flex-row items-center"
                  >
                    <Image 
                      source={{ uri: product.imagen || placeholderImage }} 
                      className="w-20 h-20 rounded-md mr-3"
                      defaultSource={{ uri: placeholderImage }}
                    />
                    
                    <View className="flex-1">
                      <Text className="text-gray-800 font-bold">{product.producto}</Text>
                      <Text className="text-gray-500 text-sm">{product.categoria}</Text>
                      
                      <View className="flex-row items-center mt-2">
                        <TouchableOpacity
                          className="bg-gray-200 w-8 h-8 rounded-full items-center justify-center"
                          onPress={() => handleQuantityChange(product.id, Math.max(0, product.cantidad - 1))}
                          disabled={product.cantidad <= 0}
                        >
                          <Ionicons name="remove" size={18} color="#374151" />
                        </TouchableOpacity>
                        
                        <Text className="mx-4 text-lg font-bold text-gray-800 min-w-[30px] text-center">
                          {product.cantidad}
                        </Text>
                        
                        <TouchableOpacity
                          className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center"
                          onPress={() => handleQuantityChange(product.id, product.cantidad + 1)}
                        >
                          <Ionicons name="add" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Detalles del Pedido</Text>
        
        <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
          <Text className="text-gray-600 mb-2">Fecha de Entrega</Text>
          <CustomDatePicker
            date={deliveryDate}
            onDateChange={onDeliveryDateChange}
            minimumDate={new Date()}
            label=""
          />
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

        <View className="bg-white rounded-lg shadow-sm p-4 mb-3 flex-row justify-between items-center">
          <Text className="text-gray-600">¿Es día feriado?</Text>
          <Switch
            value={isHoliday}
            onValueChange={setIsHoliday}
            trackColor={{ false: "#767577", true: "#0284c7" }}
            thumbColor={isHoliday ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View className="p-4 bg-white rounded-lg shadow-sm mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Productos seleccionados:</Text>
          <Text className="font-bold text-gray-800">{totalItems}</Text>
        </View>
        
        <View className="flex-row justify-between mb-4">
          <Text className="text-gray-600">Total a pagar:</Text>
          <Text className="font-bold text-gray-800">${totalAmount.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-lg items-center justify-center"
          onPress={handleCreateOrder}
          disabled={loading || totalItems === 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg">Crear Pedido</Text>
              <Text className="text-white text-sm mt-1">
                {totalItems === 0 ? 'Selecciona al menos un producto' : `${totalItems} productos | $${totalAmount.toFixed(2)}`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CreateOrderScreen;
