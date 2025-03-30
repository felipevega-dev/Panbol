import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { db } from '../services/firebase';
import { Order, OrdersState, Product } from '../types';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

interface OrderContextType extends OrdersState {
  getOrders: () => Promise<void>;
  getOrderById: (id: string) => Promise<Order | null>;
  createOrder: (orderData: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  exportOrdersToCSV: () => Promise<string>;
  isEditable: (order: Order) => boolean;
}

const OrderContext = createContext<OrderContextType | null>(null);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OrdersState>({
    orders: [],
    loading: false,
    error: null
  });

  // Obtener todos los pedidos del usuario actual
  const getOrders = async () => {
    if (!user) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const ordersRef = collection(db, 'orders');
      
      // Para usuarios normales, solo muestra sus propios pedidos
      // Para administradores, muestra todos los pedidos
      const q = user.role === 'admin' 
        ? query(ordersRef, orderBy('orderDate', 'asc')) 
        : query(ordersRef, where('userId', '==', user.id), orderBy('orderDate', 'asc'));
      
      const snapshot = await getDocs(q);
      const ordersList: Order[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Order, 'id'>;
        ordersList.push({
          id: doc.id,
          ...data
        });
      });
      
      setState({
        orders: ordersList,
        loading: false,
        error: null
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error fetching orders'
      }));
    }
  };

  // Obtener un pedido por su ID
  const getOrderById = async (id: string): Promise<Order | null> => {
    if (!user) return null;
    
    try {
      const orderDoc = await getDoc(doc(db, 'orders', id));
      
      if (orderDoc.exists()) {
        const data = orderDoc.data() as Omit<Order, 'id'>;
        // Si el usuario no es admin, verificar que el pedido sea suyo
        if (user.role !== 'admin' && data.userId !== user.id) {
          throw new Error('Unauthorized to view this order');
        }
        
        return {
          id: orderDoc.id,
          ...data
        };
      }
      
      return null;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error fetching order'
      }));
      return null;
    }
  };

  // Crear un nuevo pedido
  const createOrder = async (orderData: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!user) throw new Error('User must be logged in');
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const now = new Date().toISOString();
      
      const orderToCreate = {
        ...orderData,
        userId: user.id,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderToCreate);
      
      // Actualizar la lista de pedidos
      await getOrders();
      
      return docRef.id;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error creating order'
      }));
      throw error;
    }
  };

  // Actualizar un pedido existente
  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    if (!user) throw new Error('User must be logged in');
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Obtener el pedido actual
      const order = await getOrderById(id);
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Verificar si el pedido es editable
      if (!isEditable(order) && user.role !== 'admin') {
        throw new Error('Order is no longer editable');
      }
      
      // Actualizar el pedido
      await updateDoc(doc(db, 'orders', id), {
        ...orderData,
        updatedAt: new Date().toISOString()
      });
      
      // Actualizar la lista de pedidos
      await getOrders();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error updating order'
      }));
      throw error;
    }
  };

  // Eliminar un pedido
  const deleteOrder = async (id: string) => {
    if (!user) throw new Error('User must be logged in');
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Solo los administradores pueden eliminar pedidos
      if (user.role !== 'admin') {
        throw new Error('Unauthorized to delete orders');
      }
      
      await deleteDoc(doc(db, 'orders', id));
      
      // Actualizar la lista de pedidos
      await getOrders();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error deleting order'
      }));
      throw error;
    }
  };

  // Exportar pedidos a CSV
  const exportOrdersToCSV = async (): Promise<string> => {
    if (!user) throw new Error('User must be logged in');
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      if (state.orders.length === 0) {
        await getOrders();
      }
      
      // Crear cabecera del CSV
      let csvContent = 'Producto,Cantidad,Precio,Fecha Pedido,Fecha Entrega\n';
      
      // Agregar datos de cada pedido
      state.orders.forEach((order) => {
        order.products.forEach((product) => {
          csvContent += `${product.name},${product.quantity},${product.price},${order.orderDate},${order.deliveryDate}\n`;
        });
      });
      
      // Guardar el archivo CSV
      const fileDate = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const fileName = `panbol_pedidos_${fileDate}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      setState((prev) => ({ ...prev, loading: false }));
      
      return filePath;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error exporting orders'
      }));
      throw error;
    }
  };

  // Verificar si un pedido es editable (antes de las 20:00 del mismo día)
  const isEditable = (order: Order): boolean => {
    const orderDate = new Date(order.orderDate);
    const now = new Date();
    
    // Si la fecha del pedido es diferente a la fecha actual, no es editable
    if (
      orderDate.getDate() !== now.getDate() ||
      orderDate.getMonth() !== now.getMonth() ||
      orderDate.getFullYear() !== now.getFullYear()
    ) {
      return false;
    }
    
    // Si la hora actual es posterior a las 20:00, no es editable
    if (now.getHours() >= 20) {
      return false;
    }
    
    return true;
  };

  // Cargar pedidos cuando cambia el usuario
  useEffect(() => {
    if (user) {
      getOrders();
    } else {
      setState({
        orders: [],
        loading: false,
        error: null
      });
    }
  }, [user]);

  return (
    <OrderContext.Provider 
      value={{ 
        ...state, 
        getOrders, 
        getOrderById, 
        createOrder, 
        updateOrder, 
        deleteOrder, 
        exportOrdersToCSV,
        isEditable
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
