export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  products: Product[];
  orderDate: string;
  deliveryDate: string;
  observations: string;
  userId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface OrdersState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}
