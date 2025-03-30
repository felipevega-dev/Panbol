import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';

// Colección de productos en Firestore
const PRODUCTS_COLLECTION = 'products';

/**
 * Obtiene todos los productos del catálogo
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    throw error;
  }
};

/**
 * Obtiene un producto por su ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Product;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    throw error;
  }
};

/**
 * Obtiene productos por categoría
 */
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product))
      .filter(product => product.categoria === category);
  } catch (error) {
    console.error('Error obteniendo productos por categoría:', error);
    throw error;
  }
};
