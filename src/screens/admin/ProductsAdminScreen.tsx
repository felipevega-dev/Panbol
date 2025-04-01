import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ScrollView, Image, Platform, Modal, RefreshControl } from 'react-native';
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
  imagen: placeholderImage
};

const ProductsAdminScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<Omit<Product, 'id'>>(initialProduct);
  const [imageUrl, setImageUrl] = useState<string>(placeholderImage);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProductIdForEdit, setSelectedProductIdForEdit] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
      imagen: product.imagen
    });
    setImageUrl(product.imagen || placeholderImage);
    setShowForm(true);
  };

  // Manejar el refresh al deslizar hacia abajo
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Eliminar producto
  const handleDelete = async (productId: string) => {
    if (Platform.OS !== 'web') {
      // En móvil, usamos Alert nativo
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este producto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar', 
            onPress: async () => {
              try {
                setLoading(true);
                await deleteProduct(productId);
                setLoading(false);
                Alert.alert('Éxito', 'Producto eliminado correctamente');
                loadProducts();
              } catch (error) {
                setLoading(false);
                Alert.alert('Error', 'No se pudo eliminar el producto');
                console.error('Error eliminando producto:', error);
              }
            },
            style: 'destructive'
          }
        ]
      );
    } else {
      // En web, usamos nuestro propio diálogo de confirmación
      setConfirmDeleteId(productId);
    }
  };

  // Confirmar eliminación (para web)
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    
    try {
      setLoading(true);
      await deleteProduct(confirmDeleteId);
      setLoading(false);
      setConfirmDeleteId(null);
      
      // Mostrar mensaje (puede ser a través de un estado)
      if (Platform.OS === 'web') {
        alert('Producto eliminado correctamente');
      } else {
        Alert.alert('Éxito', 'Producto eliminado correctamente');
      }
      
      loadProducts();
    } catch (error) {
      setLoading(false);
      console.error('Error eliminando producto:', error);
      
      if (Platform.OS === 'web') {
        alert('No se pudo eliminar el producto');
      } else {
        Alert.alert('Error', 'No se pudo eliminar el producto');
      }
    }
  };

  // Manejar la importación de productos
  const handleImportComplete = (productsCount: number) => {
    if (productsCount > 0) {
      loadProducts(); // Recargar la lista de productos
    }
  };

  // Renderizar formulario de producto como un modal
  const renderFormModal = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    
    return (
      <Modal
        transparent={true}
        visible={selectedProductIdForEdit === productId}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View 
            className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-xl m-4"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Editar: {product.producto}</Text>
              <TouchableOpacity onPress={() => setSelectedProductIdForEdit(null)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {/* Imagen del producto */}
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
            
            {/* Nombre del producto */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Nombre del Producto*</Text>
              <TextInput
                value={formValues.producto}
                onChangeText={(text) => setFormValues({ ...formValues, producto: text })}
                className="border border-gray-300 rounded p-2"
                placeholder="Nombre del producto"
              />
            </View>
            
            {/* Categoría */}
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
            
            {/* ID del producto (no editable) */}
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">ID del Producto</Text>
              <TextInput
                value={formValues.productoID.toString()}
                className="border border-gray-300 rounded p-2 bg-gray-100"
                editable={false}
              />
              <Text className="text-xs text-gray-500 mt-1">ID asignado automáticamente</Text>
            </View>
            
            {/* Botones */}
            <View className="flex-row justify-end space-x-2 mt-2">
              <TouchableOpacity
                onPress={() => {
                  setSelectedProductIdForEdit(null);
                  setEditingProduct(null);
                  setFormValues(initialProduct);
                  setImageUrl(placeholderImage);
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  handleSubmit();
                  setSelectedProductIdForEdit(null);
                }}
                className="px-4 py-2 bg-blue-500 rounded"
              >
                <Text className="text-white">Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Renderizar modal de confirmación de eliminación para web
  const renderDeleteConfirmModal = () => {
    if (!confirmDeleteId) return null;
    const product = products.find(p => p.id === confirmDeleteId);
    if (!product) return null;
    
    return (
      <Modal
        transparent={true}
        visible={!!confirmDeleteId}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg shadow-lg p-4 w-11/12 max-w-md m-4">
            <View className="items-center mb-4">
              <Ionicons name="warning-outline" size={48} color="#f59e0b" />
              <Text className="text-xl font-bold mt-2 text-center">¿Eliminar este producto?</Text>
              <Text className="text-gray-600 text-center mt-1">
                Estás a punto de eliminar "{product.producto}". Esta acción no se puede deshacer.
              </Text>
            </View>
            
            <View className="flex-row justify-center space-x-3 mt-2">
              <TouchableOpacity
                onPress={() => setConfirmDeleteId(null)}
                className="px-5 py-2 bg-gray-200 rounded-lg"
              >
                <Text className="text-gray-800 font-medium">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmDelete}
                className="px-5 py-2 bg-red-500 rounded-lg"
              >
                <Text className="text-white font-medium">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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

  // Agrupar productos por categoría
  const groupedProducts = () => {
    // Obtener todas las categorías únicas
    const categories = [...new Set(products.map(p => p.categoria))].sort();
    
    // Crear un objeto con las categorías como claves
    return categories.map(category => ({
      category,
      items: products.filter(p => p.categoria === category).sort((a, b) => 
        a.producto.localeCompare(b.producto)
      )
    }));
  };

  // Renderizar sección de categoría
  const renderCategory = ({ category, items }: { category: string, items: Product[] }) => (
    <View key={category} className="mb-6">
      <Text className="text-lg font-bold mb-2 text-gray-700 bg-gray-100 p-2 rounded">
        {category}
      </Text>
      
      {Platform.OS === 'web' ? (
        // Vista web - Lista horizontal
        items.map(item => (
          <View key={item.id} className="flex-row items-center justify-between bg-white p-3 mb-2 rounded-lg shadow-sm">
            <View className="flex-row items-center flex-1">
              <Image 
                source={{ uri: item.imagen || placeholderImage }} 
                className="w-16 h-16 rounded-lg mr-3"
                defaultSource={{ uri: placeholderImage }}
              />
              
              <View className="flex-1">
                <Text className="font-bold text-lg">{item.producto}</Text>
              </View>
            </View>
            
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  setEditingProduct(item);
                  setFormValues({
                    productoID: item.productoID,
                    categoria: item.categoria,
                    producto: item.producto,
                    imagen: item.imagen
                  });
                  setImageUrl(item.imagen || placeholderImage);
                  
                  // En web, mostrar formulario junto al producto (modal)
                  setSelectedProductIdForEdit(item.id);
                }}
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
        ))
      ) : (
        // Vista móvil - Tarjetas con diseño mejorado
        <View>
          {items.map(item => (
            <View key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden mb-3">
              <View className="flex-row">
                <Image 
                  source={{ uri: item.imagen || placeholderImage }} 
                  className="w-24 h-24"
                  defaultSource={{ uri: placeholderImage }}
                />
                
                <View className="flex-1 p-3 justify-between">
                  <View>
                    <Text className="font-bold text-lg text-gray-800">{item.producto}</Text>
                    <Text className="text-xs text-gray-500">ID: {item.productoID}</Text>
                  </View>
                  
                  <View className="flex-row justify-end mt-2">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingProduct(item);
                        setFormValues({
                          productoID: item.productoID,
                          categoria: item.categoria,
                          producto: item.producto,
                          imagen: item.imagen
                        });
                        setImageUrl(item.imagen || placeholderImage);
                        setShowForm(true);
                      }}
                      className="bg-blue-500 rounded-full w-10 h-10 justify-center items-center mr-2"
                    >
                      <Ionicons name="pencil" size={18} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      className="bg-red-500 rounded-full w-10 h-10 justify-center items-center"
                    >
                      <Ionicons name="trash-outline" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      className="flex-1 bg-gray-100"
      refreshControl={
        Platform.OS !== 'web' ? 
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#0000ff']}
          tintColor="#0000ff"
        /> : undefined
      }
    >
      <View className={Platform.OS === 'web' ? "p-4" : "p-3"}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`${Platform.OS === 'web' ? 'text-2xl' : 'text-xl'} font-bold text-gray-800`}>
            Administrar Productos
          </Text>
          
          {!showForm && (
            <TouchableOpacity 
              onPress={() => {
                setShowForm(true);
                setEditingProduct(null);
                setFormValues(initialProduct);
                setImageUrl(placeholderImage);
              }}
              className={Platform.OS === 'web' 
                ? "px-4 py-2 bg-green-500 rounded" 
                : "px-3 py-2 bg-green-500 rounded-full flex-row items-center"
              }
            >
              {Platform.OS !== 'web' && <Ionicons name="add" size={18} color="white" style={{ marginRight: 4 }} />}
              <Text className="text-white font-medium">
                {Platform.OS === 'web' ? 'Nuevo Producto' : 'Nuevo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Componente de importación desde Excel - solo visible en dispositivos móviles */}
        {!showForm && Platform.OS !== 'web' && (
          <ImportProductsFromExcel onImportComplete={handleImportComplete} />
        )}
        
        {showForm && renderForm()}
        
        {selectedProductIdForEdit && renderFormModal(selectedProductIdForEdit)}
        {renderDeleteConfirmModal()}
        
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
            data={groupedProducts()}
            renderItem={({ item }) => renderCategory(item)}
            keyExtractor={(item) => item.category}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

export default ProductsAdminScreen;
