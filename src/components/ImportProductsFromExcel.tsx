import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { read, utils } from 'xlsx';
import { createProduct } from '../services/productService';
import { Product } from '../types';

interface ImportExcelProps {
  onImportComplete: (productsCount: number) => void;
}

const ImportProductsFromExcel: React.FC<ImportExcelProps> = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Función para seleccionar y leer archivo Excel
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert('Error', 'No se pudo seleccionar el archivo');
        return;
      }

      processExcelFile(file.uri);
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      Alert.alert('Error', 'No se pudo seleccionar el archivo Excel');
    }
  };

  // Procesar el archivo Excel
  const processExcelFile = async (fileUri: string) => {
    try {
      setLoading(true);

      // Leer el archivo
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Parsear Excel
      const workbook = read(fileContent, { type: 'base64' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir a JSON
      const jsonData = utils.sheet_to_json(worksheet);
      
      // Verificar estructura mínima requerida
      if (!jsonData.length) {
        Alert.alert('Error', 'El archivo no contiene datos');
        setLoading(false);
        return;
      }

      // Validar columnas requeridas
      const firstRow = jsonData[0] as any;
      const requiredColumns = ['ProductoID', 'Categoria', 'Producto', 'Imagen'];
      
      const missingColumns = requiredColumns.filter(col => 
        !Object.keys(firstRow).some(key => key === col)
      );
      
      if (missingColumns.length > 0) {
        Alert.alert(
          'Error en formato', 
          `Faltan las siguientes columnas: ${missingColumns.join(', ')}`
        );
        setLoading(false);
        return;
      }

      // Comenzar importación
      await importProducts(jsonData);
    } catch (error) {
      console.error('Error al procesar archivo Excel:', error);
      Alert.alert('Error', 'No se pudo procesar el archivo Excel');
      setLoading(false);
    }
  };

  // Importar productos a Firestore
  const importProducts = async (jsonData: any[]) => {
    try {
      setProgress({ current: 0, total: jsonData.length });
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Crear producto
          const productData: Omit<Product, 'id'> = {
            productoID: parseInt(row.ProductoID) || 0,
            categoria: row.Categoria || '',
            producto: row.Producto || '',
            imagen: row.Imagen || 'https://via.placeholder.com/150',
            precio: 0 // Como mencionaste que el precio no es relevante, lo dejamos en 0
          };

          // Validar datos mínimos
          if (!productData.producto || !productData.categoria) {
            errorCount++;
            continue;
          }

          // Guardar en Firestore
          await createProduct(productData);
          successCount++;
        } catch (error) {
          console.error(`Error al importar fila ${i + 1}:`, error);
          errorCount++;
        }

        // Actualizar progreso
        setProgress({ current: i + 1, total: jsonData.length });
      }

      // Mostrar resultados
      Alert.alert(
        'Importación Completada',
        `Se importaron ${successCount} productos correctamente.\n${errorCount} productos tuvieron errores.`
      );
      
      // Notificar al componente padre
      onImportComplete(successCount);
    } catch (error) {
      console.error('Error general al importar productos:', error);
      Alert.alert('Error', 'Ocurrió un error durante la importación');
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={pickDocument}
        disabled={loading}
        className={`p-3 rounded-lg flex-row justify-center items-center ${loading ? 'bg-gray-400' : 'bg-green-500'}`}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-medium">
              Importando... ({progress.current}/{progress.total})
            </Text>
          </>
        ) : (
          <Text className="text-white font-medium">
            Importar Productos desde Excel
          </Text>
        )}
      </TouchableOpacity>
      <Text className="text-xs text-gray-500 mt-1 text-center">
        El archivo debe tener las columnas: ProductoID, Categoria, Producto, Imagen
      </Text>
    </View>
  );
};

export default ImportProductsFromExcel;
