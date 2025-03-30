import { Product } from '../types';

// Productos predefinidos como se especifica en los requisitos
export const PREDEFINED_PRODUCTS: Omit<Product, 'quantity'>[] = [
  {
    id: 'marraqueta',
    name: 'Marraqueta',
    price: 100,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Marraqueta_2.jpg/320px-Marraqueta_2.jpg'
  },
  {
    id: 'hallulla',
    name: 'Hallulla',
    price: 120,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Hallulla.png/320px-Hallulla.png'
  },
  {
    id: 'cachito',
    name: 'Cachito',
    price: 150,
    image: 'https://cdn.pixabay.com/photo/2016/03/27/21/59/bread-1284438_960_720.jpg'
  }
];
