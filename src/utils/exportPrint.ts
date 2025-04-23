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
        th { background-color: #0284c7; color: white; padding: 10px; border: 1px solid #ddd; }
        .header { 
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white; 
          padding: 20px; 
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 { margin: 0; }
        .info-card { 
          background-color: #f9fafb; 
          padding: 20px; 
          border-radius: 8px; 
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
        }
        .info-row { display: flex; margin-bottom: 12px; }
        .info-label { font-weight: bold; width: 140px; color: #374151; }
        .info-value { color: #1f2937; }
        tr:nth-child(even) { background-color: #f9fafb; }
        tr:hover { background-color: #f3f4f6; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Pedido #${order.id.substring(0, 8)}</h1>
        <div style="margin-top: 8px; font-size: 14px; opacity: 0.9;">
          Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        </div>
      </div>
      
      <div class="info-card">
        <div class="info-row">
          <div class="info-label">Fecha de Pedido:</div>
          <div class="info-value">${orderDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Fecha de Entrega:</div>
          <div class="info-value">${deliveryDate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Es Feriado:</div>
          <div class="info-value">${order.esFeriado ? 'Sí' : 'No'}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Estado:</div>
          <div class="info-value">${order.estado}</div>
        </div>
        ${order.observaciones ? `
        <div class="info-row" style="display: block; margin-top: 10px;">
          <div class="info-label" style="margin-bottom: 8px;">Observaciones:</div>
          <div style="padding: 12px; background: #f3f4f6; border-radius: 6px; color: #4b5563;">
            ${order.observaciones}
          </div>
        </div>
        ` : ''}
      </div>
      
      <h2 style="color: #1f2937;">Productos (${order.productos.reduce((sum, p) => sum + p.cantidad, 0)})</h2>
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
      
      <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>Panbol • Sistema de Gestión de Pedidos</p>
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
