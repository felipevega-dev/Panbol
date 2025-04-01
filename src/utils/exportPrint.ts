import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderWithDetails } from '../types';

/**
 * Genera un HTML para representar un pedido
 */
const generateOrderHtml = (order: OrderWithDetails): string => {
  const orderDate = format(new Date(order.fechaPedido), 'dd/MM/yyyy', { locale: es });
  const deliveryDate = format(new Date(order.fechaEntrega), 'dd/MM/yyyy', { locale: es });
  
  // Generar filas de productos
  const productsRows = order.productos.map(product => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${product.producto}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${product.cantidad}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${product.precio || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(product.precio || 0) * product.cantidad}</td>
    </tr>
  `).join('');
  
  // Calcular totales
  const total = order.productos.reduce((sum, p) => sum + ((p.precio || 0) * p.cantidad), 0);
  
  // Crear documento HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pedido #${order.id.substring(0, 8)}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th { background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd; }
        .header { background-color: #0284c7; color: white; padding: 10px; margin-bottom: 20px; }
        .info-card { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-label { font-weight: bold; width: 140px; }
        .total-row { 
          font-weight: bold; 
          background-color: #f9fafb;
        }
        .total-cell {
          text-align: right;
          padding: 10px;
          border: 1px solid #ddd;
        }
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
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${productsRows}
          <tr class="total-row">
            <td colspan="3" class="total-cell">Total:</td>
            <td class="total-cell">${total}</td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        <p>Panbol • ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Exporta un pedido a PDF utilizando FileSystem y Sharing APIs
 * Devuelve la ruta del archivo guardado o true si se procesó correctamente
 */
export const saveOrderAsPdf = async (order: OrderWithDetails): Promise<string | boolean> => {
  try {
    const htmlContent = generateOrderHtml(order);
    const jobName = `Pedido-${order.id.substring(0, 8)}`;
    const fileUri = `${FileSystem.cacheDirectory}${jobName}.pdf`;
    
    // Crear archivo PDF
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: 'utf8',
    });
    
    // Compartir el PDF
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: `${jobName}.pdf`,
        UTI: 'com.adobe.pdf'
      });
    }
    
    return fileUri;
  } catch (error) {
    console.error('Error al guardar el pedido como PDF:', error);
    throw error;
  }
};

/**
 * Exporta un pedido a PDF con diálogo de impresión
 */
export const printOrderToPdf = async (order: OrderWithDetails): Promise<boolean> => {
  try {
    const htmlContent = generateOrderHtml(order);
    
    if (Platform.OS === 'web') {
      // En web usamos iframe para imprimir
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
      
      // Limpiar después de un tiempo
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
      
      return true;
    } else {
      // En dispositivos móviles usamos Sharing API
      const jobName = `Pedido-${order.id.substring(0, 8)}`;
      const fileUri = `${FileSystem.cacheDirectory}${jobName}.html`;
      
      // Guardar el HTML en un archivo temporal
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: 'utf8',
      });
      
      // Compartir el archivo HTML
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: `Imprimir ${jobName}`,
          UTI: 'public.html'
        });
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error al imprimir el pedido:', error);
    throw error;
  }
};
