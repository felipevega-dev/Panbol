import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderWithDetails } from '../types';

/**
 * Exporta múltiples pedidos a Excel
 */
export const exportOrdersToExcel = async (orders: OrderWithDetails[]): Promise<string | boolean> => {
  try {
    // Crear un nuevo libro
    const wb = XLSX.utils.book_new();
    
    // Datos para la hoja principal con solo las columnas esenciales
    const ordersData = orders.map(order => [
      order.id,
      format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es }),
      format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es }),
      order.estado,
      order.esFeriado ? 'Sí' : 'No',
    ]);
    
    // Añadir cabeceras
    const headers = [
      'Pedido ID', 
      'Fecha Pedido', 
      'Fecha Entrega', 
      'Estado', 
      'Es Feriado'
    ];
    
    const mainSheetData = [
      headers,
      ...ordersData
    ];
    
    // Crear la hoja principal
    const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 25 }, // ID
      { wch: 15 }, // Fecha Pedido
      { wch: 15 }, // Fecha Entrega
      { wch: 15 }, // Estado
      { wch: 12 }  // Es Feriado
    ];
    
    mainSheet['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, mainSheet, 'Pedidos');
    
    // Generar el archivo
    const fileName = `pedidos_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    
    if (Platform.OS === 'web') {
      // Para web, descargar directamente
      XLSX.writeFile(wb, fileName);
      return true;
    } else {
      // Para dispositivos móviles
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Compartir el archivo
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar Pedidos'
      });
      
      // Limpiar el archivo temporal después de compartir
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('No se pudo eliminar el archivo temporal:', cleanupError);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};
