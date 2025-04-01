import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderWithDetails } from '../types';

/**
 * Genera un string en formato CSV con formato correcto para Excel
 */
export const generateOrderCsv = (order: OrderWithDetails): string => {
  // Cabeceras
  const headers = ['Fecha de Pedido', 'Fecha de Entrega', 'Es Feriado', 'Producto', 'Cantidad'].join(',');
  
  // Formatear fechas
  const orderDate = format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es });
  const deliveryDate = format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es });
  const isHoliday = order.esFeriado ? 'Sí' : 'No';
  
  // Crear filas para cada producto
  const rows = order.productos.map(product => {
    return [
      orderDate,
      deliveryDate,
      isHoliday,
      product.producto,
      product.cantidad
    ].join(',');
  }).join('\n');
  
  // Si no hay productos, crear al menos una fila con la información básica
  if (order.productos.length === 0) {
    const emptyRow = [orderDate, deliveryDate, isHoliday, '', ''].join(',');
    return headers + '\n' + emptyRow;
  }
  
  return headers + '\n' + rows;
};

/**
 * Exporta un pedido a un archivo CSV para web
 */
const exportOrderToCsvWeb = (order: OrderWithDetails): boolean => {
  try {
    const csvContent = generateOrderCsv(order);
    
    // Crear un elemento a para descargar el archivo
    const element = document.createElement('a');
    
    // Crear un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Configurar elemento a
    element.href = url;
    element.download = `pedido_${order.id.substring(0, 8)}.csv`;
    document.body.appendChild(element);
    
    // Simular clic y limpiar
    element.click();
    setTimeout(() => {
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a CSV en web:', error);
    return false;
  }
};

/**
 * Exporta un pedido a un archivo CSV para dispositivos móviles
 */
const exportOrderToCsvMobile = async (order: OrderWithDetails): Promise<boolean> => {
  try {
    const csvContent = generateOrderCsv(order);
    
    // Verificar si se puede compartir
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      console.warn('La exportación a CSV no está disponible en este dispositivo');
      return false;
    }
    
    // Crear archivo temporal
    const fileUri = `${FileSystem.cacheDirectory}pedido_${order.id.substring(0, 8)}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    // Compartir el archivo
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: `Pedido #${order.id.substring(0, 8)}`,
      UTI: 'public.comma-separated-values-text'  // para iOS
    });
    
    return true;
  } catch (error) {
    console.error('Error al exportar a CSV en móvil:', error);
    return false;
  }
};

/**
 * Exporta un pedido a un archivo CSV (compatible con web y móvil)
 */
export const exportOrderToCsv = (order: OrderWithDetails): boolean | Promise<boolean> => {
  if (Platform.OS === 'web') {
    return exportOrderToCsvWeb(order);
  } else {
    return exportOrderToCsvMobile(order);
  }
};
