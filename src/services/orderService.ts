import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, OrderDetail, ProductWithQuantity, OrderWithDetails } from '../types';

// Colecciones en Firestore
const ORDERS_COLLECTION = 'orders';
const ORDER_DETAILS_COLLECTION = 'orderDetails';

/**
 * Obtiene todos los pedidos de un usuario
 */
export const getUserOrders = async (userEmail: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION), 
      where('useremail', '==', userEmail)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaPedido: formatFirestoreTimestamp(doc.data().fechaPedido),
      fechaEntrega: formatFirestoreTimestamp(doc.data().fechaEntrega),
      createdAt: formatFirestoreTimestamp(doc.data().createdAt),
      updatedAt: formatFirestoreTimestamp(doc.data().updatedAt)
    } as Order));
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    throw error;
  }
};

/**
 * Obtiene un pedido por su ID con todos sus detalles
 */
export const getOrderWithDetails = async (orderId: string): Promise<OrderWithDetails | null> => {
  try {
    // Obtener el pedido
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderDocSnap = await getDoc(orderDocRef);
    
    if (!orderDocSnap.exists()) {
      return null;
    }
    
    const orderData = {
      id: orderDocSnap.id,
      ...orderDocSnap.data(),
      fechaPedido: formatFirestoreTimestamp(orderDocSnap.data().fechaPedido),
      fechaEntrega: formatFirestoreTimestamp(orderDocSnap.data().fechaEntrega),
      createdAt: formatFirestoreTimestamp(orderDocSnap.data().createdAt),
      updatedAt: formatFirestoreTimestamp(orderDocSnap.data().updatedAt)
    } as Order;
    
    // Obtener los detalles del pedido
    const q = query(
      collection(db, ORDER_DETAILS_COLLECTION),
      where('pedidoID', '==', orderId)
    );
    
    const detailsQuerySnapshot = await getDocs(q);
    
    const productDetails = detailsQuerySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OrderDetail));
    
    // Convertir detalles a ProductWithQuantity array
    const productos: ProductWithQuantity[] = productDetails.map(detail => ({
      id: detail.productoID,
      productoID: Number(detail.productoID),
      producto: detail.nombreProducto || '',
      precio: detail.precio || 0,
      imagen: detail.imagen || '',
      categoria: '',  // Este dato no lo tenemos en los detalles
      cantidad: detail.cantidad
    }));
    
    return {
      ...orderData,
      productos
    };
  } catch (error) {
    console.error('Error obteniendo pedido con detalles:', error);
    throw error;
  }
};

/**
 * Crea un nuevo pedido con sus detalles
 */
export const createOrder = async (
  userEmail: string, 
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'useremail'>, 
  products: ProductWithQuantity[]
): Promise<string> => {
  try {
    // 1. Crear el pedido principal
    const newOrder = {
      ...orderData,
      useremail: userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      estado: 'PENDIENTE', // Estado inicial
      total: calculateTotal(products)
    };
    
    const orderDocRef = await addDoc(collection(db, ORDERS_COLLECTION), newOrder);
    
    // 2. Crear los detalles del pedido
    for (const product of products) {
      if (product.cantidad > 0) {
        const orderDetail = {
          pedidoID: orderDocRef.id,
          productoID: product.id,
          cantidad: product.cantidad,
          nombreProducto: product.producto,
          precio: product.precio,
          imagen: product.imagen
        };
        
        await addDoc(collection(db, ORDER_DETAILS_COLLECTION), orderDetail);
      }
    }
    
    return orderDocRef.id;
  } catch (error) {
    console.error('Error creando pedido:', error);
    throw error;
  }
};

/**
 * Actualiza un pedido existente
 */
export const updateOrder = async (
  orderId: string, 
  orderData: Partial<Order>, 
  products?: ProductWithQuantity[]
): Promise<void> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Actualizar el pedido principal
    const updateData = {
      ...orderData,
      updatedAt: serverTimestamp()
    };
    
    if (products) {
      updateData.total = calculateTotal(products);
    }
    
    await updateDoc(orderRef, updateData);
    
    // Si hay productos, actualizar los detalles
    if (products) {
      // 1. Eliminar detalles actuales
      const q = query(
        collection(db, ORDER_DETAILS_COLLECTION),
        where('pedidoID', '==', orderId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // 2. Crear nuevos detalles
      for (const product of products) {
        if (product.cantidad > 0) {
          const orderDetail = {
            pedidoID: orderId,
            productoID: product.id,
            cantidad: product.cantidad,
            nombreProducto: product.producto,
            precio: product.precio,
            imagen: product.imagen
          };
          
          await addDoc(collection(db, ORDER_DETAILS_COLLECTION), orderDetail);
        }
      }
    }
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    throw error;
  }
};

/**
 * Elimina un pedido y sus detalles
 */
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    // 1. Eliminar los detalles del pedido
    const q = query(
      collection(db, ORDER_DETAILS_COLLECTION),
      where('pedidoID', '==', orderId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    // 2. Eliminar el pedido principal
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    throw error;
  }
};

/**
 * Formatea marcas de tiempo de Firestore a Date
 */
const formatFirestoreTimestamp = (timestamp: any): Date | string => {
  if (!timestamp) return '';
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  return timestamp;
};

/**
 * Calcula el total de un pedido
 */
const calculateTotal = (products: ProductWithQuantity[]): number => {
  return products.reduce((total, product) => {
    return total + ((product.precio || 0) * product.cantidad);
  }, 0);
};
