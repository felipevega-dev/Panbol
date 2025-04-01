import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderWithDetails } from '../types';

/**
 * Genera un archivo Excel a partir de un pedido
 */
export const exportOrderToExcel = async (order: OrderWithDetails): Promise<boolean> => {
  try {
    // Formatear fechas
    const orderDate = format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es });
    const deliveryDate = format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es });
    const isHoliday = order.esFeriado ? 'Sí' : 'No';
    
    // Crear un nuevo libro y hoja
    const wb = XLSX.utils.book_new();
    
    // Datos para la hoja principal: detalles del pedido + productos
    const productData = order.productos.map(product => [
      orderDate,
      deliveryDate,
      isHoliday,
      product.producto,
      product.cantidad
    ]);
    
    // Si no hay productos, crear al menos una fila con la información básica
    if (productData.length === 0) {
      productData.push([orderDate, deliveryDate, isHoliday, '', '']);
    }
    
    // Añadir cabeceras
    const mainSheetData = [
      ['Fecha de Pedido', 'Fecha de Entrega', 'Es Feriado', 'Producto', 'Cantidad'],
      ...productData
    ];
    
    // Crear la hoja principal
    const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, mainSheet, 'Detalles del Pedido');

    // Si hay observaciones, añadir una hoja adicional
    if (order.observaciones) {
      const observationsSheet = XLSX.utils.aoa_to_sheet([
        ['Observaciones'],
        [order.observaciones]
      ]);
      XLSX.utils.book_append_sheet(wb, observationsSheet, 'Observaciones');
    }
    
    // Generar el archivo y compartir según la plataforma
    if (Platform.OS === 'web') {
      // Para web, descargar el archivo
      XLSX.writeFile(wb, `pedido_${order.id.substring(0, 8)}.xlsx`);
    } else {
      // Para móviles, compartir el archivo
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        console.warn('La exportación a Excel no está disponible en este dispositivo');
        return false;
      }
      
      // Convertir a base64
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      // Guardar en archivo temporal
      const fileUri = `${FileSystem.cacheDirectory}pedido_${order.id.substring(0, 8)}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Compartir el archivo
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Pedido #${order.id.substring(0, 8)}`,
        UTI: 'org.openxmlformats.spreadsheetml.sheet' // para iOS
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};
