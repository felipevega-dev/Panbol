import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import { Product } from '../../types';
import { ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ImportProductsFromExcel from '../../components/ImportProductsFromExcel';

// Placeholder para imágenes
const placeholderImage = 'https://via.placeholder.com/150/CCCCCC/888888?text=Sin+Imagen';

// Categorías disponibles (podríamos cargarlas desde Firebase si quisiéramos)
const CATEGORIAS = [
  { value: '', label: 'Seleccionar categoría...' },
  { value: 'Dulce', label: 'Dulce' },
  { value: 'Tradicional', label: 'Tradicional' },
  { value: 'Hojaldraro', label: 'Hojaldraro' },
  { value: 'Especial', label: 'Especial' },
  { value: 'Integral', label: 'Integral' },
  { value: 'Artesanal', label: 'Artesanal' },
  { value: 'Amasado', label: 'Amasado' },
  { value: 'Berlín', label: 'Berlín' },
];

// Producto inicial con valores por defecto
const initialProduct: Omit<Product, 'id'> = {
  productoID: 0,
  categoria: '',
  producto: '',
  imagen: placeholderImage,
  precio: 0
};

const ProductsAdminScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<Omit<Product, 'id'>>(initialProduct);
  const [imageUrl, setImageUrl] = useState<string>(placeholderImage);
  const [uploadingImage, setUploadingImage] = useState(false);
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

  // Seleccionar imagen del dispositivo
  const pickImage = async () => {
    try {
      // Solicitar permisos de galería
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Necesitamos permisos para acceder a tus fotos');
          return;
        }
      }

      setUploadingImage(true);

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setUploadingImage(false);
        return;
      }

      const selectedAsset = result.assets[0];
      if (selectedAsset) {
        // En una aplicación real, aquí subirías la imagen a Firebase Storage
        // Por ahora, simplemente usamos la URI local (sirve en desarrollo)
        setImageUrl(selectedAsset.uri);
        setFormValues({ ...formValues, imagen: selectedAsset.uri });
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  // Generar el próximo ID de producto
  const getNextProductID = () => {
    if (products.length === 0) return 1;
    const maxID = Math.max(...products.map(p => p.productoID));
    return maxID + 1;
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

      // Asignar ID automático si es nuevo producto
      const dataToSave = { 
        ...formValues,
        productoID: editingProduct ? formValues.productoID : getNextProductID()
      };

      if (editingProduct) {
        // Actualizar producto
        await updateProduct(editingProduct.id, dataToSave);
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        // Crear nuevo producto
        await createProduct(dataToSave);
        Alert.alert('Éxito', 'Producto creado correctamente');
      }

      // Resetear formulario
      setFormValues(initialProduct);
      setEditingProduct(null);
      setShowForm(false);
      setImageUrl(placeholderImage);
      
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
    setImageUrl(product.imagen || placeholderImage);
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

  // Manejar la importación de productos
  const handleImportComplete = (productsCount: number) => {
    if (productsCount > 0) {
      loadProducts(); // Recargar la lista de productos
    }
  };

  // Renderizar formulario de producto
  const renderForm = () => (
    <View className="bg-white p-4 rounded-lg shadow-md mb-4">
      <Text className="text-xl font-bold mb-4">
        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      </Text>
      
      {/* Imagen del producto con opción para seleccionar */}
      <View className="items-center mb-4">
        <View className="relative">
          <Image 
            source={{ uri: imageUrl }} 
            className="w-24 h-24 rounded-lg"
            defaultSource={{ uri: placeholderImage }}
          />
          
          {uploadingImage && (
            <View className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-30 items-center justify-center rounded-lg">
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
        </View>
        
        <TouchableOpacity
          onPress={pickImage}
          className="mt-2 px-3 py-1 bg-gray-200 rounded-md flex-row items-center"
          disabled={uploadingImage}
        >
          <Ionicons name="camera-outline" size={16} color="#555" style={{ marginRight: 4 }} />
          <Text className="text-gray-700">Seleccionar imagen</Text>
        </TouchableOpacity>
      </View>
      
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
        {Platform.OS === 'web' ? (
          <View className="border border-gray-300 rounded overflow-hidden">
            <select
              value={formValues.categoria}
              onChange={(e) => setFormValues({ ...formValues, categoria: e.target.value })}
              className="w-full p-2 bg-white"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </View>
        ) : (
          <View className="border border-gray-300 rounded">
            <Picker
              selectedValue={formValues.categoria}
              onValueChange={(value) => setFormValues({ ...formValues, categoria: value })}
            >
              {CATEGORIAS.map(cat => (
                <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
              ))}
            </Picker>
          </View>
        )}
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-1">ID del Producto</Text>
        <TextInput
          value={formValues.productoID.toString()}
          onChangeText={(text) => 
            setFormValues({ ...formValues, productoID: parseInt(text) || 0 })
          }
          keyboardType="numeric"
          className="border border-gray-300 rounded p-2 bg-gray-100"
          placeholder="0"
          editable={false} // Hacemos que este campo no sea editable manualmente
        />
        <Text className="text-xs text-gray-500 mt-1">ID asignado automáticamente</Text>
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
            setImageUrl(placeholderImage);
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
      <View className="flex-row items-center flex-1">
        <Image 
          source={{ uri: item.imagen || placeholderImage }} 
          className="w-16 h-16 rounded-lg mr-3"
          defaultSource={{ uri: placeholderImage }}
        />
        
        <View className="flex-1">
          <Text className="font-bold text-lg">{item.producto}</Text>
          <Text className="text-gray-500">{item.categoria}</Text>
          {item.precio > 0 && (
            <Text className="text-gray-700">Precio: ${item.precio.toFixed(2)}</Text>
          )}
        </View>
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
                setImageUrl(placeholderImage);
              }}
              className="px-4 py-2 bg-green-500 rounded"
            >
              <Text className="text-white">Nuevo Producto</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Componente de importación desde Excel - solo visible en dispositivos móviles */}
        {!showForm && Platform.OS !== 'web' && (
          <ImportProductsFromExcel onImportComplete={handleImportComplete} />
        )}
        
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
