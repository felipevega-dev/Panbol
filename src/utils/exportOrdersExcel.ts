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
    
    // Datos para la hoja principal con todos los pedidos
    const ordersData = orders.flatMap(order => {
      return order.productos.map(product => [
        order.id,
        format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es }),
        format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es }),
        order.estado,
        order.esFeriado ? 'Sí' : 'No',
        product.producto,
        product.cantidad,
        product.precio || 0,
        (product.precio || 0) * product.cantidad,
        order.observaciones || ''
      ]);
    });
    
    // Añadir cabeceras
    const headers = [
      'Pedido ID', 
      'Fecha Pedido', 
      'Fecha Entrega', 
      'Estado', 
      'Es Feriado', 
      'Producto', 
      'Cantidad', 
      'Precio', 
      'Subtotal', 
      'Observaciones'
    ];
    
    const mainSheetData = [
      headers,
      ...ordersData
    ];
    
    // Crear la hoja principal
    const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 20 }, // ID
      { wch: 15 }, // Fecha Pedido
      { wch: 15 }, // Fecha Entrega
      { wch: 10 }, // Estado
      { wch: 10 }, // Es Feriado
      { wch: 25 }, // Producto
      { wch: 10 }, // Cantidad
      { wch: 10 }, // Precio
      { wch: 10 }, // Subtotal
      { wch: 30 }  // Observaciones
    ];
    
    mainSheet['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, mainSheet, 'Todos los Pedidos');
    
    // También crear una hoja para cada pedido
    orders.forEach(order => {
      const orderProducts = order.productos.map(product => [
        product.producto,
        product.cantidad,
        product.precio || 0,
        (product.precio || 0) * product.cantidad
      ]);
      
      const orderSheet = XLSX.utils.aoa_to_sheet([
        ['Detalles del Pedido'],
        ['ID:', order.id],
        ['Fecha Pedido:', format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es })],
        ['Fecha Entrega:', format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es })],
        ['Estado:', order.estado],
        ['Es Feriado:', order.esFeriado ? 'Sí' : 'No'],
        ['Observaciones:', order.observaciones || ''],
        [''],
        ['Productos'],
        ['Producto', 'Cantidad', 'Precio', 'Subtotal'],
        ...orderProducts
      ]);
      
      // Ajustar ancho de columnas para cada hoja de pedido
      orderSheet['!cols'] = [
        { wch: 25 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 10 }, // Precio
        { wch: 10 }  // Subtotal
      ];
      
      XLSX.utils.book_append_sheet(wb, orderSheet, `Pedido-${order.id.substring(0, 6)}`);
    });
    
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
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar Pedidos'
      });
      
      return fileUri;
    }
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    throw error;
  }
};
