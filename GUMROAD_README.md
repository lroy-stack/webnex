# WebNex - Plataforma SaaS Modular para Gestión de Clientes de Desarrollo Web

![WebNex Logo](https://ik.imagekit.io/insomnialz/webnex-logo.png?updatedAt=1746819797684)

## 🚀 Descripción General

WebNex es una plataforma SaaS completa diseñada específicamente para empresas de desarrollo web que necesitan gestionar clientes, proyectos y servicios de manera eficiente. Esta solución todo-en-uno está completamente en español y permite a los desarrolladores web ofrecer una experiencia profesional a sus clientes mientras gestionan todo el ciclo de vida del proyecto.

## ✨ Características Principales

### Para Clientes
- **Soluciones Web Modulares**: Elección entre packs prediseñados o personalización con módulos individuales
- **Panel de Cliente**: Seguimiento del progreso del proyecto, acceso a recursos y gestión de servicios
- **Chat en Tiempo Real**: Comunicación directa con el equipo de desarrollo
- **Actualizaciones de Proyecto**: Notificaciones sobre hitos y actualizaciones del proyecto
- **Proceso de Onboarding**: Configuración guiada para nuevos clientes
- **Carrito de Compra**: Selección y compra sencilla de servicios y packs

### Para Administradores
- **Gestión de Clientes**: Añadir, editar y gestionar cuentas de clientes
- **Gestión de Servicios**: Crear y gestionar servicios y packs disponibles
- **Gestión de Proyectos**: Seguimiento del progreso y actualización a clientes
- **Sistema de Chat**: Comunicación con clientes en tiempo real
- **Panel de Análisis**: Monitorización del rendimiento de la plataforma y actividad de clientes
- **Panel de Configuración**: Personalización de ajustes de la plataforma
- **Herramientas de Administración**: Acceso a herramientas administrativas especializadas

## 💻 Stack Tecnológico

- **Frontend**:
  - React 18
  - TypeScript
  - Vite (Herramienta de construcción)
  - Tailwind CSS (Estilos)
  - shadcn/ui (Componentes UI)
  - React Router (Navegación)
  - Zustand (Gestión de Estado)
  - React Query (Obtención de Datos)
  - Framer Motion (Animaciones)

- **Backend**:
  - Supabase (Backend como Servicio)
  - PostgreSQL (Base de datos)
  - Supabase Auth (Autenticación)
  - Supabase Storage (Almacenamiento de Archivos)
  - Supabase Edge Functions (Funciones Serverless)
  - Supabase Realtime (Suscripciones en Tiempo Real)

## 🛠️ Instalación y Configuración

### Requisitos Previos

- Node.js (v18 o superior)
- npm (v8 o superior)
- Supabase CLI

### Configuración de Desarrollo Local

1. Clona el repositorio:
   ```sh
   git clone <url-del-repositorio>
   cd webnex
   ```

2. Instala las dependencias:
   ```sh
   npm install
   ```

3. Configura las variables de entorno:
   - Copia `.env.development` a `.env.local` y actualiza los valores según sea necesario

4. Inicia el servidor de desarrollo:
   ```sh
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## 🗄️ Configuración de la Base de Datos

WebNex incluye scripts para configurar fácilmente la base de datos en Supabase:

```bash
chmod +x setup_webnex_db.sh
./setup_webnex_db.sh
```

Este script interactivo te guiará a través de todo el proceso de configuración, incluyendo:
- Selección de un método de configuración
- Configuración de un usuario administrador
- Verificación de la configuración

## 📊 Estructura de la Base de Datos

La base de datos incluye las siguientes tablas principales:

- **client_profiles**: Almacena información de clientes
- **my_services**: Servicios disponibles para comprar
- **my_packs**: Packs de servicios que combinan múltiples servicios
- **client_projects**: Proyectos de clientes con seguimiento de estado
- **project_milestones**: Hitos para cada proyecto
- **project_updates**: Actualizaciones y notificaciones para proyectos
- **chat_conversations**: Conversaciones de chat entre clientes y administradores
- **chat_messages**: Mensajes individuales de chat
- **shopping_cart**: Carrito de compra para servicios y packs
- **shopping_cart_items**: Elementos en el carrito de compra
- **user_roles**: Asignaciones de roles de usuario (admin, client, staff)
- **onboarding_form_templates**: Plantillas para formularios de onboarding
- **project_preliminary_questionnaire**: Requisitos iniciales del proyecto del cliente

## 🔒 Seguridad

WebNex implementa políticas de Row Level Security (RLS) en todas las tablas para garantizar la seguridad de los datos y el control de acceso adecuado basado en roles de usuario.

## 💼 Casos de Uso

WebNex es ideal para:

- **Agencias de Desarrollo Web**: Gestiona múltiples clientes y proyectos simultáneamente
- **Freelancers**: Ofrece una experiencia profesional a tus clientes
- **Estudios de Diseño**: Combina servicios de diseño y desarrollo en una plataforma unificada
- **Consultoras Digitales**: Gestiona todo el ciclo de vida del proyecto digital

## 🌟 Beneficios

- **Ahorro de Tiempo**: Automatiza tareas repetitivas y centraliza la comunicación
- **Profesionalismo**: Ofrece una experiencia de cliente de alta calidad
- **Escalabilidad**: Gestiona desde unos pocos hasta cientos de clientes
- **Personalización**: Adapta los servicios y packs a tus necesidades específicas
- **Todo en Español**: Interfaz completamente en español, ideal para el mercado hispanohablante

## 📦 Qué Incluye

- Código fuente completo (Frontend + Backend)
- Scripts de configuración de base de datos
- Documentación detallada
- Estructura de base de datos con políticas de seguridad
- Sistema de autenticación y gestión de usuarios
- Panel de administración completo
- Panel de cliente intuitivo
- Sistema de chat en tiempo real
- Gestión de proyectos con hitos y actualizaciones
- Carrito de compra para servicios y packs

## 🚀 Despliegue

1. Construye el proyecto:
   ```sh
   npm run build
   ```
2. Despliega el directorio `dist` en tu proveedor de hosting preferido

## 📄 Licencia

Este proyecto se vende con una licencia de uso único. Cada compra permite el uso en un solo dominio/proyecto. Para múltiples implementaciones, se requieren licencias adicionales.

---

© 2025 WebNex. Todos los derechos reservados.
