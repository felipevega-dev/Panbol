import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

import { useAuth } from './AuthContext';
import { 
  Order, 
  ProductWithQuantity,
  OrderWithDetails,
  OrderStatus
} from '../types';
import {
  getUserOrders,
  getOrderWithDetails,
  createOrder,
  updateOrder,
  deleteOrder
} from '../services/orderService';
import { getAllProducts } from '../services/productService';
import { exportOrdersToExcel as exportToExcel } from '../utils/exportOrdersExcel';

interface OrderContextState {
  orders: Order[];
  selectedOrder: OrderWithDetails | null;
  availableProducts: ProductWithQuantity[];
  loading: boolean;
  error: string | null;
}

interface OrderContextValue extends OrderContextState {
  getOrders: () => Promise<void>;
  getOrderDetails: (orderId: string) => Promise<void>;
  createNewOrder: (orderData: Partial<Order>, products: ProductWithQuantity[]) => Promise<void>;
  updateExistingOrder: (orderId: string, orderData: Partial<Order>, products: ProductWithQuantity[]) => Promise<void>;
  removeOrder: (orderId: string) => Promise<void>;
  exportOrdersToCSV: () => Promise<string>;
  exportOrdersToExcel: () => Promise<string | boolean>;
  selectProduct: (productId: string, quantity: number) => void;
  resetSelectedProducts: () => void;
  loadAvailableProducts: () => Promise<void>;
  canEditOrder: (order: Order) => boolean;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

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
  
  const [state, setState] = useState<OrderContextState>({
    orders: [],
    selectedOrder: null,
    availableProducts: [],
    loading: false,
    error: null,
  });

  // Cargar pedidos cuando cambia el usuario
  useEffect(() => {
    if (user) {
      getOrders();
    } else {
      setState(prev => ({
        ...prev,
        orders: [],
        selectedOrder: null
      }));
    }
  }, [user]);

  // Obtener todos los pedidos del usuario actual
  const getOrders = async () => {
    if (!user) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const userOrders = await getUserOrders(user.email);
      setState(prev => ({
        ...prev,
        orders: userOrders,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener pedidos'
      }));
    }
  };

  // Obtener detalles de un pedido específico
  const getOrderDetails = async (orderId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const orderDetails = await getOrderWithDetails(orderId);
      setState(prev => ({
        ...prev,
        selectedOrder: orderDetails,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al obtener detalles del pedido'
      }));
    }
  };

  // Crear un nuevo pedido
  const createNewOrder = async (orderData: Partial<Order>, products: ProductWithQuantity[]) => {
    if (!user) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await createOrder(
        user.email,
        {
          fechaPedido: new Date(),
          fechaEntrega: orderData.fechaEntrega || new Date(),
          observaciones: orderData.observaciones || '',
          estado: 'PENDIENTE',
          esFeriado: orderData.esFeriado || false
        },
        products
      );
      
      await getOrders(); // Recargar la lista de pedidos
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al crear pedido'
      }));
    }
  };

  // Actualizar un pedido existente
  const updateExistingOrder = async (orderId: string, orderData: Partial<Order>, products: ProductWithQuantity[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await updateOrder(
        orderId,
        orderData,
        products
      );
      
      await getOrders(); // Recargar la lista de pedidos
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar pedido'
      }));
    }
  };

  // Eliminar un pedido
  const removeOrder = async (orderId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await deleteOrder(orderId);
      await getOrders(); // Recargar la lista de pedidos
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar pedido'
      }));
    }
  };

  // Exportar pedidos a CSV
  const exportOrdersToCSV = async (): Promise<string> => {
    if (!user || state.orders.length === 0) {
      throw new Error('No hay pedidos para exportar');
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Obtener todos los pedidos con sus detalles
      const ordersWithDetails: OrderWithDetails[] = [];
      
      for (const order of state.orders) {
        const details = await getOrderWithDetails(order.id);
        if (details) {
          ordersWithDetails.push(details);
        }
      }
      
      // Crear contenido CSV
      let csvContent = 'PedidoID,Fecha Pedido,Fecha Entrega,Estado,Email,Producto,Cantidad,Precio,Subtotal,Observaciones,Es Feriado\n';
      
      ordersWithDetails.forEach(order => {
        order.productos.forEach(product => {
          const row = [
            order.id,
            order.fechaPedido instanceof Date ? format(order.fechaPedido, 'dd/MM/yyyy', { locale: es }) : order.fechaPedido,
            order.fechaEntrega instanceof Date ? format(order.fechaEntrega, 'dd/MM/yyyy', { locale: es }) : order.fechaEntrega,
            order.estado,
            order.useremail,
            product.producto,
            product.cantidad,
            product.precio || 0,
            product.cantidad * (product.precio || 0),
            `"${order.observaciones.replace(/"/g, '""')}"`,
            order.esFeriado ? 'Sí' : 'No'
          ];
          
          csvContent += row.join(',') + '\n';
        });
      });
      
      // Guardar archivo CSV
      const fileName = `pedidos_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
      
      return filePath;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al exportar pedidos'
      }));
      
      throw error;
    }
  };

  // Exportar pedidos a Excel
  const exportOrdersToExcel = async (): Promise<string | boolean> => {
    if (!user || state.orders.length === 0) {
      throw new Error('No hay pedidos para exportar');
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Obtener todos los pedidos con sus detalles
      const ordersWithDetails: OrderWithDetails[] = [];
      
      for (const order of state.orders) {
        const details = await getOrderWithDetails(order.id);
        if (details) {
          ordersWithDetails.push(details);
        }
      }
      
      // Exportar a Excel usando la utilidad
      const result = await exportToExcel(ordersWithDetails);
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al exportar pedidos'
      }));
      
      throw error;
    }
  };

  // Cargar productos disponibles
  const loadAvailableProducts = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const products = await getAllProducts();
      
      // Convertir a ProductWithQuantity con cantidad inicial 0
      const productsWithQuantity = products.map(product => ({
        ...product,
        cantidad: 0
      }));
      
      setState(prev => ({
        ...prev,
        availableProducts: productsWithQuantity,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar productos'
      }));
    }
  };

  // Seleccionar un producto para el pedido
  const selectProduct = (productId: string, quantity: number) => {
    setState(prev => ({
      ...prev,
      availableProducts: prev.availableProducts.map(product => 
        product.id === productId 
          ? { ...product, cantidad: quantity } 
          : product
      )
    }));
  };

  // Resetear productos seleccionados
  const resetSelectedProducts = () => {
    setState(prev => ({
      ...prev,
      availableProducts: prev.availableProducts.map(product => ({ 
        ...product, 
        cantidad: 0 
      }))
    }));
  };

  // Verificar si un pedido puede ser editado (solo hasta las 20:00 del mismo día)
  const canEditOrder = (order: Order): boolean => {
    if (!order.fechaPedido) return false;
    
    const orderDate = order.fechaPedido instanceof Date 
      ? order.fechaPedido 
      : new Date(order.fechaPedido);
    
    const now = new Date();
    
    // Verificar si es el mismo día
    const sameDay = 
      orderDate.getDate() === now.getDate() &&
      orderDate.getMonth() === now.getMonth() &&
      orderDate.getFullYear() === now.getFullYear();
    
    // Verificar si es antes de las 20:00
    const before8PM = now.getHours() < 20;
    
    return sameDay && before8PM;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await updateOrder(orderId, { estado: newStatus }, []);
      await getOrders(); // Recargar la lista de pedidos
      if (state.selectedOrder && state.selectedOrder.id === orderId) {
        await getOrderDetails(orderId); // Actualizar el pedido seleccionado si coincide
      }
      
      setState(prev => ({
        ...prev,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar estado del pedido'
      }));
    }
  };

  const contextValue: OrderContextValue = {
    ...state,
    getOrders,
    getOrderDetails,
    createNewOrder,
    updateExistingOrder,
    removeOrder,
    exportOrdersToCSV,
    exportOrdersToExcel,
    selectProduct,
    resetSelectedProducts,
    loadAvailableProducts,
    canEditOrder,
    updateOrderStatus
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};
