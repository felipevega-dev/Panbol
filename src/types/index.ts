export interface Product {
  id: string;
  productoID: number;         // ID numérico del producto
  categoria: string;          // Categoría del producto
  producto: string;           // Nombre del producto
  imagen: string;             // URL de la imagen
  precio?: number;            // Precio unitario (opcional)
}

export interface OrderDetail {
  id: string;                 // ID del detalle
  pedidoID: string;           // Referencia al pedido
  productoID: string;         // Referencia al producto
  cantidad: number;           // Cantidad solicitada
  imagen?: string;            // URL de la imagen (opcional)
  nombreProducto?: string;    // Nombre del producto (para referencia rápida)
  precio?: number;            // Precio unitario (para historial)
}

export interface Order {
  id: string;                 // ID único del pedido
  fechaPedido: Date | string; // Fecha en que se realizó el pedido
  fechaEntrega: Date | string;// Fecha programada para entrega
  observaciones: string;      // Observaciones generales
  useremail: string;          // Email del usuario que realizó el pedido
  estado: string;             // Estado del pedido (PENDIENTE, ENTREGADO, CANCELADO)
  esFeriado: boolean;         // Indica si es día feriado
  total?: number;             // Total del pedido
  createdAt: Date | string;   // Fecha de creación en sistema
  updatedAt: Date | string;   // Fecha de última actualización
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;               // Rol (ADMIN, CLIENTE)
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export type OrderStatus = 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';

export interface ProductWithQuantity extends Product {
  cantidad: number;           // Cantidad seleccionada del producto
}

export interface OrderWithDetails extends Order {
  productos: ProductWithQuantity[]; // Productos incluidos en el pedido
}
