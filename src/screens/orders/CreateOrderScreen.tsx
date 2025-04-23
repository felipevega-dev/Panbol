import React, { useState, useEffect, useRef } from 'react';
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
  Switch,
  Modal,
  RefreshControl,
  Animated
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
  
  // Estado para animaciones y UI
  const [refreshing, setRefreshing] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // En web, el panel siempre está visible
  const [showCartPanel, setShowCartPanel] = useState(Platform.OS === 'android' || Platform.OS === 'ios' ? false : true);
  // Modal para mostrar productos seleccionados en móvil
  const [showMobileCartModal, setShowMobileCartModal] = useState(false);
  
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

  // Estado para modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');

  // Manejar refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableProducts();
    setRefreshing(false);
  };

  // Efecto de animación para el botón flotante
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Cambiar cantidad de un producto
  const handleQuantityChange = (productId: string, quantity: number) => {
    selectProduct(productId, quantity);
    
    // Animar botón flotante cuando se agrega un producto
    if (quantity > 0) {
      animateButton();
    }
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
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
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

  // Manejar cierre del modal de éxito
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigation.navigate('Orders');
  };

  // Calcular total del pedido
  const totalAmount = availableProducts
    .reduce((sum, product) => sum + ((product.precio || 0) * product.cantidad), 0);
    
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

  // Renderizar elemento de producto para móvil
  const renderProductItem = (product: ProductWithQuantity) => {
    return Platform.OS === 'web' ? (
      // Versión Web
      <View 
        key={product.id} 
        className="bg-white rounded-lg shadow-sm p-4 mb-3 flex-row items-center"
      >
        <Image 
          source={{ uri: product.imagen || placeholderImage }} 
          className="w-16 h-16 rounded-md mr-3"
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
            
            <TextInput
              className="mx-2 text-lg font-bold text-center border border-gray-300 rounded min-w-[50px] px-2 py-1"
              value={product.cantidad.toString()}
              onChangeText={(text) => {
                const newValue = parseInt(text);
                if (!isNaN(newValue) && newValue >= 0) {
                  handleQuantityChange(product.id, newValue);
                } else if (text === '') {
                  // Permitir borrar todo el texto
                  handleQuantityChange(product.id, 0);
                }
              }}
              keyboardType="numeric"
              maxLength={3}
            />
            
            <TouchableOpacity
              className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center"
              onPress={() => handleQuantityChange(product.id, product.cantidad + 1)}
            >
              <Ionicons name="add" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ) : (
      // Versión Móvil - Diseño compacto y eficiente
      <View 
        key={product.id} 
        className="bg-white rounded-lg shadow-sm p-3 mb-2 flex-row items-center"
      >
        <Image 
          source={{ uri: product.imagen || placeholderImage }} 
          className="w-12 h-12 rounded-md mr-2"
          defaultSource={{ uri: placeholderImage }}
        />
        
        <View className="flex-1 justify-center">
          <Text className="text-gray-800 font-bold text-sm" numberOfLines={1}>{product.producto}</Text>
        </View>
        
        <View className="flex-row items-center ml-2 bg-gray-100 rounded-lg p-1">
          <TouchableOpacity
            className="w-8 h-8 items-center justify-center"
            onPress={() => handleQuantityChange(product.id, Math.max(0, product.cantidad - 1))}
            disabled={product.cantidad <= 0}
          >
            <Ionicons name="remove" size={18} color={product.cantidad > 0 ? "#374151" : "#9ca3af"} />
          </TouchableOpacity>
          
          <TextInput
            className="w-[45px] text-center font-bold"
            value={product.cantidad.toString()}
            onChangeText={(text) => {
              const newValue = parseInt(text);
              if (!isNaN(newValue) && newValue >= 0) {
                handleQuantityChange(product.id, newValue);
              } else if (text === '') {
                handleQuantityChange(product.id, 0);
              }
            }}
            keyboardType="numeric"
            maxLength={3}
          />
          
          <TouchableOpacity
            className="w-8 h-8 items-center justify-center"
            onPress={() => handleQuantityChange(product.id, product.cantidad + 1)}
          >
            <Ionicons name="add" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Renderizar sección de categoría
  const renderCategory = ({ category, items }: { category: string, items: ProductWithQuantity[] }) => (
    <View key={category} className="mb-3">
      <Text className="text-base font-bold mb-1 text-gray-700 bg-gray-100 p-2 rounded-lg">
        {category}
      </Text>
      
      <View>
        {items.map((product) => renderProductItem(product))}
      </View>
    </View>
  );

  // Para la versión web, mantener el diseño original sin modales
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return (
      <View className="flex-1 bg-gray-100">
        <ScrollView className="flex-1">
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
            <View className="p-4 mr-[300px]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">Productos Disponibles</Text>
              </View>
              
              {groupedProducts().map(({ category, items }) => (
                <View key={category} className="mb-4">
                  <Text className="text-lg font-bold mb-2 text-gray-700 bg-gray-100 p-2 rounded">
                    {category}
                  </Text>
                  
                  <View className="grid grid-cols-3 gap-2">
                    {items.map((product) => renderProductItem(product))}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className="p-4 mr-[300px]">
            <Text className="text-lg font-bold text-gray-800 mb-2">Detalles del Pedido</Text>
            
            <View className="bg-white rounded-lg shadow-sm p-4 mb-3">
              <Text className="text-gray-600 mb-2">Fecha de Entrega</Text>
              <CustomDatePicker
                date={deliveryDate}
                onDateChange={onDeliveryDateChange}
                minimumDate={new Date()}
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
        </ScrollView>

        {/* Panel lateral para productos seleccionados - siempre visible en web */}
        <View className="absolute top-0 right-0 bottom-0 w-[300px] bg-white shadow-lg z-10">
          <View className="p-4 bg-blue-500 flex-row items-center justify-between">
            <Text className="text-white font-bold text-lg">Productos seleccionados</Text>
          </View>
          
          <ScrollView className="flex-1 p-2">
            {availableProducts.filter(p => p.cantidad > 0).length === 0 ? (
              <View className="p-4 items-center">
                <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-600 text-center mt-2">
                  No has seleccionado productos
                </Text>
              </View>
            ) : (
              availableProducts.filter(p => p.cantidad > 0).map(product => (
                <View 
                  key={product.id} 
                  className="bg-gray-50 rounded-lg p-2 mb-2 flex-row items-center"
                >
                  <Image 
                    source={{ uri: product.imagen || placeholderImage }} 
                    className="w-12 h-12 rounded-md mr-2"
                    defaultSource={{ uri: placeholderImage }}
                  />
                  
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{product.producto}</Text>
                    <Text className="text-gray-600 text-xs">Cantidad: {product.cantidad}</Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(product.id, 0)}
                    className="p-1"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
          
          <View className="p-4 border-t border-gray-200">
            <Text className="text-gray-800 font-bold text-lg">Total: {totalItems} productos</Text>
          </View>
        </View>
        
        {/* Botón flotante para confirmar pedido */}
        <Animated.View 
          className="absolute bottom-8 right-8 mr-[300px]"
          style={{ 
            transform: [{ scale: buttonScale }],
            width: 'auto'
          }}
        >
          <TouchableOpacity
            className={`py-3 px-6 rounded-lg ${totalItems > 0 ? 'bg-blue-600' : 'bg-gray-400'} flex-row items-center justify-center shadow-lg`}
            onPress={handleCreateOrder}
            disabled={totalItems === 0 || loading}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="white" />
            <Text className="text-white font-bold ml-2">
              {totalItems > 0 
                ? `Confirmar Pedido (${totalItems} productos)` 
                : "Selecciona productos"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Modal de éxito centrado correctamente en web */}
        {showSuccessModal && (
          <View className="absolute top-0 left-0 w-full h-full flex items-center justify-center" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}>
            <View className="bg-white rounded-lg p-6 w-11/12 max-w-md mx-auto">
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-3">
                  <Ionicons name="checkmark" size={32} color="#22c55e" />
                </View>
                <Text className="text-2xl font-bold text-gray-800">¡Pedido Creado!</Text>
                <Text className="text-gray-600 text-center mt-2">
                  Tu pedido ha sido creado exitosamente.
                </Text>
              </View>
              
              <View className="flex-row justify-center mt-4">
                <TouchableOpacity
                  onPress={handleCloseSuccessModal}
                  className="bg-green-500 py-3 px-6 rounded-lg"
                >
                  <Text className="text-white font-bold">Ver Mis Pedidos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Versión móvil simplificada
  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          <Text className="text-xl font-bold text-gray-800 mb-6">Crear Nuevo Pedido</Text>
          
          {/* Sección de fecha y opciones */}
          <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <Text className="text-gray-800 font-medium mb-3">Fecha de Entrega</Text>
            <CustomDatePicker
              date={deliveryDate}
              onDateChange={onDeliveryDateChange}
              minimumDate={new Date()}
            />
            
            <View className="flex-row items-center mt-4">
              <Text className="text-gray-800 font-medium flex-1">¿Es día feriado?</Text>
              <Switch
                value={isHoliday}
                onValueChange={setIsHoliday}
                trackColor={{ false: "#e5e7eb", true: "#93c5fd" }}
                thumbColor={isHoliday ? "#3b82f6" : "#f4f3f4"}
              />
            </View>
          </View>
          
          {/* Observaciones */}
          <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <Text className="text-gray-800 font-medium mb-3">Observaciones</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-3 text-gray-800 min-h-[100]"
              placeholder="Observaciones adicionales para tu pedido..."
              multiline
              textAlignVertical="top"
              value={observations}
              onChangeText={setObservations}
            />
          </View>
          
          {/* Cabecera de listado de productos */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-800">Productos</Text>
            
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setShowMobileCartModal(true)}
            >
              <Ionicons name="cart-outline" size={20} color="#3b82f6" />
              <Text className="text-blue-500 ml-1 font-medium">
                {totalItems > 0 ? `Ver seleccionados (${totalItems})` : "Carrito vacío"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Catálogo de productos */}
          {loading ? (
            <View className="items-center p-8">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-600 mt-2">Cargando productos...</Text>
            </View>
          ) : availableProducts.length === 0 ? (
            <View className="p-8 bg-white rounded-lg shadow-sm mb-8 items-center">
              <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 text-center mt-2">
                No hay productos disponibles
              </Text>
              <TouchableOpacity 
                className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
                onPress={onRefresh}
              >
                <Text className="text-white font-bold">Intentar de nuevo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {groupedProducts().map(renderCategory)}
              
              <View className="h-40" />
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Modal para mostrar productos seleccionados en móvil */}
      <Modal
        visible={showMobileCartModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMobileCartModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg w-[90%] max-h-[80%] shadow-lg">
            <View className="p-4 bg-blue-500 flex-row items-center justify-between">
              <Text className="text-white font-bold text-lg">Productos seleccionados</Text>
              <TouchableOpacity onPress={() => setShowMobileCartModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="max-h-[300px] p-2">
              {availableProducts.filter(p => p.cantidad > 0).length === 0 ? (
                <View className="p-4 items-center">
                  <Ionicons name="cart-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-600 text-center mt-2">
                    No has seleccionado productos
                  </Text>
                </View>
              ) : (
                availableProducts.filter(p => p.cantidad > 0).map(product => (
                  <View 
                    key={product.id} 
                    className="bg-gray-50 rounded-lg p-2 mb-2 flex-row items-center"
                  >
                    <Image 
                      source={{ uri: product.imagen || placeholderImage }} 
                      className="w-12 h-12 rounded-md mr-2"
                      defaultSource={{ uri: placeholderImage }}
                    />
                    
                    <View className="flex-1">
                      <Text className="text-gray-800 font-medium">{product.producto}</Text>
                      <Text className="text-gray-600 text-xs">Cantidad: {product.cantidad}</Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => {
                        handleQuantityChange(product.id, 0);
                        if (availableProducts.filter(p => p.cantidad > 0).length <= 1) {
                          setShowMobileCartModal(false);
                        }
                      }}
                      className="p-1"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View className="p-4 border-t border-gray-200">
              <Text className="text-gray-800 font-bold text-lg mb-4">Total: {totalItems} productos</Text>
              <TouchableOpacity
                className="bg-blue-500 py-2 rounded-lg"
                onPress={() => setShowMobileCartModal(false)}
              >
                <Text className="text-white font-bold text-center">Continuar comprando</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Botón flotante para confirmar pedido (adaptativo) */}
      <Animated.View 
        className="absolute bottom-8 left-0 right-0"
        style={{ 
          transform: [{ scale: buttonScale }],
          width: '90%',
          maxWidth: 400,
          alignSelf: 'center'
        }}
      >
        <TouchableOpacity
          className={`py-3 px-6 rounded-lg ${totalItems > 0 ? 'bg-blue-600' : 'bg-gray-400'} flex-row items-center justify-center shadow-lg`}
          onPress={handleCreateOrder}
          disabled={totalItems === 0 || loading}
        >
          <Ionicons name="checkmark-circle-outline" size={24} color="white" />
          <Text className="text-white font-bold ml-2">
            {totalItems > 0 
              ? `Confirmar Pedido (${totalItems} productos)` 
              : "Selecciona productos"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg p-6 w-[90%] max-w-md">
            <View className="items-center mb-4">
              <View className="bg-green-100 rounded-full p-3 mb-2">
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">¡Pedido Creado!</Text>
              <Text className="text-gray-600 text-center mt-2">
                Tu pedido ha sido creado correctamente.
              </Text>
            </View>
            
            <View className="flex-row justify-center mt-4">
              <TouchableOpacity
                onPress={handleCloseSuccessModal}
                className="bg-green-500 py-3 px-6 rounded-lg"
              >
                <Text className="text-white font-bold">Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CreateOrderScreen;
