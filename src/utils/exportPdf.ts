import { Platform } from 'react-native';
import { OrderWithDetails } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

/**
 * Genera un HTML básico para representar un pedido
 */
const generateOrderHtml = (order: OrderWithDetails): string => {
  const orderDate = format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es });
  const deliveryDate = format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es });
  
  // Generar filas de productos
  const productsRows = order.productos.map(product => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${product.producto}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.cantidad}</td>
    </tr>
  `).join('');
  
  // Crear documento HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pedido #${order.id.substring(0, 8)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th { background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd; }
        .header { background-color: #0284c7; color: white; padding: 10px; margin-bottom: 20px; }
        .info-card { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 140px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pedido #${order.id.substring(0, 8)}</h1>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Fecha de Pedido:</div>
          <div>${orderDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Fecha de Entrega:</div>
          <div>${deliveryDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Es Feriado:</div>
          <div>${order.esFeriado ? 'Sí' : 'No'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Estado:</div>
          <div>${order.estado}</div>
        </div>
        ${order.observaciones ? `
        <div class="info-row" style="display: block; margin-top: 10px;">
          <div class="info-label">Observaciones:</div>
          <div style="padding: 8px; background: #f3f4f6; border-radius: 4px; margin-top: 5px;">
            ${order.observaciones}
          </div>
        </div>
        ` : ''}
      </div>
      
      <h2>Productos (${order.productos.reduce((sum, p) => sum + p.cantidad, 0)})</h2>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${productsRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

/**
 * Exporta un pedido como PDF para web
 */
const exportOrderToPdfWeb = async (order: OrderWithDetails): Promise<boolean> => {
  try {
    const htmlContent = generateOrderHtml(order);
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    if (iframe.contentDocument) {
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();
      
      if (iframe.contentWindow) {
        iframe.contentWindow.onload = function() {
          setTimeout(() => {
            iframe.contentWindow?.print();
          }, 250);
        };
      }
    }
    
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a PDF en web:', error);
    return false;
  }
};

/**
 * Exporta un pedido como PDF para dispositivos móviles usando expo-print
 */
const exportOrderToPdfMobile = async (order: OrderWithDetails): Promise<boolean> => {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      console.warn('La exportación no está disponible en este dispositivo');
      return false;
    }

    const htmlContent = generateOrderHtml(order);
    
    // Generar el PDF usando expo-print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });
    
    // Compartir el archivo PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Pedido #${order.id.substring(0, 8)}`,
      UTI: 'com.adobe.pdf'
    });

    // Limpiar el archivo temporal
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (cleanupError) {
      console.warn('No se pudo eliminar el archivo temporal:', cleanupError);
    }

    return true;
  } catch (error) {
    console.error('Error al exportar a PDF en móvil:', error);
    return false;
  }
};

/**
 * Exporta un pedido como PDF
 */
export const exportOrderToPdf = async (order: OrderWithDetails): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return await exportOrderToPdfWeb(order);
    } else {
      return await exportOrderToPdfMobile(order);
    }
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    throw error;
  }
};
