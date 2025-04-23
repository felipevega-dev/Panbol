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
    
    // Crear un nuevo libro
    const wb = XLSX.utils.book_new();
    
    // Definir estilos base
    wb.Styles = {
      Fonts: [
        { sz: 11 }, // 0: normal
        { sz: 11, bold: true }, // 1: bold
        { sz: 16, bold: true }, // 2: title
        { sz: 14, bold: true }, // 3: subtitle
      ],
      Fills: [
        { fgColor: { rgb: "FFFFFF" } }, // 0: white
        { fgColor: { rgb: "2563EB" } }, // 1: blue (title)
        { fgColor: { rgb: "F3F4F6" } }, // 2: light gray
        { fgColor: { rgb: "64748B" } }, // 3: header gray
        { fgColor: { rgb: "F9FAFB" } }, // 4: alternate row
      ],
      Borders: [
        { // 0: all borders
          top: { style: 'thin', color: { rgb: "CCCCCC" } },
          bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
          left: { style: 'thin', color: { rgb: "CCCCCC" } },
          right: { style: 'thin', color: { rgb: "CCCCCC" } }
        }
      ],
      CellXfs: [
        { // 0: normal
          font: 0,
          border: 0,
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        { // 1: bold
          font: 1,
          border: 0,
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        { // 2: title
          font: 2,
          fill: 1,
          border: 0,
          alignment: { horizontal: 'center', vertical: 'center' }
        },
        { // 3: header cell
          font: 1,
          fill: 2,
          border: 0,
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        { // 4: value cell
          font: 0,
          border: 0,
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        { // 5: table header
          font: 1,
          fill: 3,
          border: 0,
          alignment: { horizontal: 'center', vertical: 'center' }
        },
        { // 6: centered value
          font: 0,
          border: 0,
          alignment: { horizontal: 'center', vertical: 'center' }
        },
        { // 7: alternate row
          font: 0,
          fill: 4,
          border: 0,
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        { // 8: total label
          font: 1,
          fill: 2,
          border: 0,
          alignment: { horizontal: 'right', vertical: 'center' }
        },
        { // 9: total value
          font: 1,
          fill: 2,
          border: 0,
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      ]
    };

    // Datos del encabezado del pedido
    const headerData = [
      ['Detalles del Pedido'],
      [''],
      ['ID Pedido:', `#${order.id.substring(0, 8)}`],
      ['Fecha de Pedido:', orderDate],
      ['Fecha de Entrega:', deliveryDate],
      ['Es Feriado:', isHoliday],
      ['Estado:', order.estado],
      [''],  // Línea en blanco para separar
      ['Lista de Productos'],
      [''],
      ['Producto', 'Cantidad']
    ];

    // Datos de productos
    const productData = order.productos.map(product => [
      product.producto,
      product.cantidad
    ]);
    
    // Combinar datos de encabezado y productos
    const mainSheetData = [
      ...headerData,
      ...productData,
      [''],  // Línea en blanco
      ['Total Productos:', order.productos.reduce((sum, p) => sum + p.cantidad, 0)]
    ];
    
    // Crear la hoja principal
    const mainSheet = XLSX.utils.aoa_to_sheet(mainSheetData);
    
    // Aplicar estilos
    mainSheet['!rows'] = [{ hpt: 30 }]; // Altura del título
    
    // Título principal
    mainSheet['A1'].s = wb.Styles.CellXfs[2];
    
    // Etiquetas y valores
    for (let i = 3; i <= 7; i++) {
      mainSheet[`A${i}`].s = wb.Styles.CellXfs[3];
      mainSheet[`B${i}`].s = wb.Styles.CellXfs[4];
    }
    
    // Subtítulo "Lista de Productos"
    mainSheet['A9'].s = wb.Styles.CellXfs[2];
    
    // Encabezados de tabla
    mainSheet['A11'].s = wb.Styles.CellXfs[5];
    mainSheet['B11'].s = wb.Styles.CellXfs[5];
    
    // Productos
    const productsStartRow = 12;
    const productsEndRow = productsStartRow + productData.length - 1;
    
    for (let row = productsStartRow; row <= productsEndRow; row++) {
      const isEvenRow = row % 2 === 0;
      mainSheet[`A${row}`].s = isEvenRow ? wb.Styles.CellXfs[7] : wb.Styles.CellXfs[0];
      mainSheet[`B${row}`].s = isEvenRow ? wb.Styles.CellXfs[7] : wb.Styles.CellXfs[6];
    }
    
    // Total
    const totalRow = productsEndRow + 2;
    mainSheet[`A${totalRow}`].s = wb.Styles.CellXfs[8];
    mainSheet[`B${totalRow}`].s = wb.Styles.CellXfs[9];
    
    // Merge cells
    mainSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },  // Título principal
      { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } }   // Lista de Productos
    ];

    // Ajustar ancho de columnas
    mainSheet['!cols'] = [
      { wch: 40 },  // Columna A - Producto
      { wch: 15 }   // Columna B - Cantidad
    ];
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, mainSheet, 'Pedido');

    // Si hay observaciones, añadir una hoja adicional
    if (order.observaciones) {
      const observationsSheet = XLSX.utils.aoa_to_sheet([
        ['Observaciones'],
        [''],
        [order.observaciones]
      ]);
      
      // Estilos para observaciones
      observationsSheet['A1'].s = wb.Styles.CellXfs[2];
      observationsSheet['A3'].s = wb.Styles.CellXfs[0];
      
      // Ajustar ancho de columna para observaciones
      observationsSheet['!cols'] = [{ wch: 80 }];
      
      XLSX.utils.book_append_sheet(wb, observationsSheet, 'Observaciones');
    }
    
    // Generar el archivo y compartir según la plataforma
    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, `pedido_${order.id.substring(0, 8)}.xlsx`);
    } else {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        console.warn('La exportación a Excel no está disponible en este dispositivo');
        return false;
      }
      
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileUri = `${FileSystem.cacheDirectory}pedido_${order.id.substring(0, 8)}.xlsx`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `Pedido #${order.id.substring(0, 8)}`,
        UTI: 'org.openxmlformats.spreadsheetml.sheet'
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return false;
  }
};
