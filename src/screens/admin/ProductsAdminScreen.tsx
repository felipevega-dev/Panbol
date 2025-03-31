import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import { Product } from '../../types';
import { ActivityIndicator } from 'react-native';

// Producto inicial con valores por defecto
const initialProduct: Omit<Product, 'id'> = {
  productoID: 0,
  categoria: '',
  producto: '',
  imagen: 'https://via.placeholder.com/150',
  precio: 0
};

const ProductsAdminScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<Omit<Product, 'id'>>(initialProduct);
  const navigation = useNavigation();

  // Cargar productos al inicio
  useEffect(() => {
    loadProducts();
  }, []);

  // Cargar todos los productos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    try {
      // Validaciones básicas
      if (!formValues.producto.trim()) {
        return Alert.alert('Error', 'El nombre del producto es obligatorio');
      }

      if (!formValues.categoria.trim()) {
        return Alert.alert('Error', 'La categoría es obligatoria');
      }

      if (editingProduct) {
        // Actualizar producto
        await updateProduct(editingProduct.id, formValues);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        // Crear nuevo producto
        const newId = await createProduct({
          ...formValues,
          productoID: products.length + 1 // Generar un ID único (mejorar esto en producción)
        });
        Alert.alert('Éxito', 'Producto creado correctamente');
      }

      // Resetear formulario
      setFormValues(initialProduct);
      setEditingProduct(null);
      setShowForm(false);
      
      // Recargar productos
      loadProducts();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el producto');
      console.error('Error guardando producto:', error);
    }
  };

  // Comenzar edición de producto
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormValues({
      productoID: product.productoID,
      categoria: product.categoria,
      producto: product.producto,
      imagen: product.imagen,
      precio: product.precio
    });
    setShowForm(true);
  };

  // Eliminar producto
  const handleDelete = async (productId: string) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que deseas eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            try {
              await deleteProduct(productId);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
              console.error('Error eliminando producto:', error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Renderizar formulario de producto
  const renderForm = () => (
    <View className="bg-white p-4 rounded-lg shadow-md mb-4">
      <Text className="text-xl font-bold mb-4">
        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      </Text>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Nombre del Producto*</Text>
        <TextInput
          value={formValues.producto}
          onChangeText={(text) => setFormValues({ ...formValues, producto: text })}
          className="border border-gray-300 rounded p-2"
          placeholder="Nombre del producto"
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Categoría*</Text>
        <TextInput
          value={formValues.categoria}
          onChangeText={(text) => setFormValues({ ...formValues, categoria: text })}
          className="border border-gray-300 rounded p-2"
          placeholder="Categoría"
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">URL de Imagen</Text>
        <TextInput
          value={formValues.imagen}
          onChangeText={(text) => setFormValues({ ...formValues, imagen: text })}
          className="border border-gray-300 rounded p-2"
          placeholder="https://ejemplo.com/imagen.jpg"
        />
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">Precio (opcional)</Text>
        <TextInput
          value={formValues.precio.toString()}
          onChangeText={(text) => 
            setFormValues({ ...formValues, precio: parseFloat(text) || 0 })
          }
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2"
          placeholder="0.00"
        />
      </View>
      
      <View className="flex-row justify-end space-x-2">
        <TouchableOpacity
          onPress={() => {
            setShowForm(false);
            setEditingProduct(null);
            setFormValues(initialProduct);
          }}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          <Text>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleSubmit}
          className="px-4 py-2 bg-blue-500 rounded"
        >
          <Text className="text-white">Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar elemento de producto
  const renderItem = ({ item }: { item: Product }) => (
    <View className="flex-row items-center justify-between bg-white p-3 mb-2 rounded-lg shadow-sm">
      <View className="flex-1">
        <Text className="font-bold text-lg">{item.producto}</Text>
        <Text className="text-gray-500">{item.categoria}</Text>
        {item.precio > 0 && (
          <Text className="text-gray-700">Precio: ${item.precio.toFixed(2)}</Text>
        )}
      </View>
      
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          className="px-3 py-1 bg-blue-100 rounded mr-2"
        >
          <Text className="text-blue-800">Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          className="px-3 py-1 bg-red-100 rounded"
        >
          <Text className="text-red-800">Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">Administrar Productos</Text>
          
          {!showForm && (
            <TouchableOpacity 
              onPress={() => {
                setShowForm(true);
                setEditingProduct(null);
                setFormValues(initialProduct);
              }}
              className="px-4 py-2 bg-green-500 rounded"
            >
              <Text className="text-white">Nuevo Producto</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {showForm && renderForm()}
        
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" className="mt-4" />
        ) : products.length === 0 ? (
          <View className="py-8 bg-white rounded-lg items-center">
            <Text className="text-gray-500 text-lg text-center">
              No hay productos disponibles.
            </Text>
            {!showForm && (
              <TouchableOpacity 
                onPress={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-500 rounded"
              >
                <Text className="text-white">Crear el primer producto</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default ProductsAdminScreen;
