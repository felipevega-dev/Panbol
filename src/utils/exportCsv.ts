import { Platform } from 'react-native';
import { OrderWithDetails, ProductWithQuantity } from '../types';

/**
 * Genera un string en formato CSV a partir de un pedido
 */
export const generateOrderCsv = (order: OrderWithDetails): string => {
  const headers = 'ID Producto,Producto,Categoria,Cantidad\n';
  
  // Mapear productos a filas CSV
  const rows = order.productos.map(product => {
    return `${product.productoID},"${product.producto}","${product.categoria}",${product.cantidad}`;
  }).join('\n');
  
  // Añadir información del pedido
  const orderInfo = `\n\nFecha de Pedido,${new Date(order.fechaPedido).toLocaleDateString()}\n` +
    `Fecha de Entrega,${new Date(order.fechaEntrega).toLocaleDateString()}\n` +
    `Observaciones,"${order.observaciones || ''}"\n` +
    `Estado,${order.estado}\n`;
  
  return headers + rows + orderInfo;
};

/**
 * Exporta un pedido a un archivo CSV (solo funciona en web)
 */
export const exportOrderToCsv = (order: OrderWithDetails) => {
  if (Platform.OS !== 'web') {
    console.warn('La exportación a CSV solo está disponible en web');
    return false;
  }
  
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
    console.error('Error al exportar a CSV:', error);
    return false;
  }
};
