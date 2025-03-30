# Panbol - Aplicación de Gestión de Pedidos

Aplicación de gestión de pedidos desarrollada con React Native, Expo y NativeWind para estilizar componentes.

## Características

- **Autenticación**: Sistema de login con email y contraseña
- **Listado de pedidos**: Mostrar pedidos ordenados por fecha (más antiguo al más nuevo)
- **Visualización de pedidos**: Detalle de productos, cantidades y fechas
- **Edición de pedidos**: Permitir edición solo hasta las 20:00 del mismo día
- **Creación de pedidos**: Interfaz para seleccionar productos predefinidos y sus cantidades
- **Exportación a CSV**: Funcionalidad para exportar pedidos en formato CSV

## Tecnologías utilizadas

- React Native
- Expo
- Firebase (Firestore, Authentication)
- NativeWind (estilización basada en TailwindCSS)
- TypeScript

## Requisitos previos

- Node.js (v14 o superior)
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Firebase

## Instalación

1. Clona este repositorio:
   ```
   git clone https://github.com/tu-usuario/panbol-app.git
   cd panbol-app
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Configura Firebase:
   - Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/)
   - Habilita la autenticación por correo electrónico y contraseña
   - Crea una base de datos en Firestore
   - Actualiza el archivo `src/services/firebase.ts` con tus credenciales

## Ejecución

Para iniciar la aplicación en modo desarrollo:

```
npm start
```

Luego puedes:
- Presionar `a` para abrir en Android
- Presionar `i` para abrir en iOS
- Presionar `w` para abrir en web

## Estructura del proyecto

```
src/
  ├── components/       # Componentes reutilizables
  ├── screens/          # Pantallas de la aplicación
  │   ├── auth/         # Pantallas de autenticación
  │   ├── orders/       # Pantallas de pedidos
  │   └── profile/      # Pantalla de perfil
  ├── navigation/       # Configuración de navegación
  ├── services/         # Servicios (Firebase, exportación)
  ├── hooks/            # Hooks personalizados
  ├── contexts/         # Contextos para estado global
  ├── utils/            # Funciones de utilidad
  ├── constants/        # Constantes y configuración
  └── types/            # Definiciones de tipos TypeScript
```

## Pantallas principales

- **Login**: Inicio de sesión con email y contraseña
- **Register**: Registro de nuevos usuarios
- **Orders**: Listado de pedidos con opción de exportar a CSV
- **OrderDetail**: Detalles de un pedido específico
- **CreateOrder**: Creación de nuevos pedidos
- **EditOrder**: Edición de pedidos existentes (disponible hasta las 20:00 del mismo día)
- **Profile**: Perfil de usuario y opciones de cuenta

## Configuración de Firebase

La aplicación utiliza Firebase para:
- Autenticación de usuarios
- Almacenamiento de datos de pedidos en Firestore
- Reglas de seguridad para proteger los datos

## Licencia

[MIT](LICENSE)
