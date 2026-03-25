# Mini E-commerce MFE

**Microfrontends + Microservices - Arquitectura Distribuida**

---

## Resumen Ejecutivo

Este proyecto es un **mini e-commerce** implementado con una arquitectura moderna de **microfrontends (MFE)** en el frontend y **microservicios** en el backend, permitiendo despliegue independiente de cada módulo de negocio.

### Características Principales

- **Arquitectura de Microfrontends** con single-spa y React
- **Backend de Microservicios** con Spring Boot y Spring Cloud
- **Comunicación Asíncrona** con RabbitMQ
- **Service Discovery** con Netflix Eureka
- **API Gateway** como punto de entrada único

---

## Tech Stack

| Capa | Tecnología |
|------|-------------|
| Frontend | React 17, single-spa, Webpack 5, SystemJS |
| Backend | Spring Boot 3.2, Spring Cloud 2023.0 |
| Database | MySQL 8.4 (3 bases de datos independientes) |
| Messaging | RabbitMQ 3.13 |
| Container | Docker, Docker Compose |

---

## Estructura del Proyecto

```
e-commerce/
├── mfe-shell/              # Root config + Navbar (puerto 9000)
├── catalog/                # MFE Catálogo de productos (puerto 8501)
├── checkout/               # MFE Carrito y checkout (puerto 8502)
├── ms-eureka/             # Netflix Eureka (puerto 8761)
├── ms-gateway/            # Spring Cloud Gateway (puerto 8080)
├── ms-catalog-service/    # Servicio de productos (puerto 8081)
├── ms-checkout-service/   # Servicio de órdenes (puerto 8082)
├── ms-inventory-service/  # Servicio de inventario (puerto 8083)
├── docker-compose.yml     # MySQL x3 + RabbitMQ
└── docs/                 # Documentación detallada
```

---

## Cómo Ejecutar

### 1. Levantar Infraestructura

```bash
docker-compose up -d
```

### 2. Iniciar Microservicios

```bash
# Eureka (primero)
cd ms-eureka && mvn spring-boot:run

# Gateway
cd ms-gateway && mvn spring-boot:run

# Servicios
cd ms-catalog-service && mvn spring-boot:run
cd ms-checkout-service && mvn spring-boot:run
cd ms-inventory-service && mvn spring-boot:run
```

### 3. Iniciar Microfrontends

```bash
cd mfe-shell && npm start
cd catalog && npm start
cd checkout && npm start
```

### 4. Acceder

- **Aplicación**: http://localhost:9000
- **Eureka**: http://localhost:8761
- **RabbitMQ**: http://localhost:15672 (guest/guest)

---

## Arquitectura de Comunicación

### Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Browser    │────►│   Gateway   │────►│  Servicios  │
│  (MFEs)     │     │   :8080     │     │   (JPA)     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                       │
      ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│localStorage │                         │   MySQL     │
│ (carrito)   │                         │ (por servicio)
└─────────────┘                         └─────────────┘
```

### Eventos del Carrito

- **Agregar**: `localStorage.setItem('ecommerce-cart', ...)`
- **Sincronización**: `window.dispatchEvent('cart:updated')`
- **Navbar**: Escucha cambios y actualiza contador

---

## API Endpoints

| Servicio | Método | Endpoint | Descripción |
|----------|--------|----------|-------------|
| Catalog | GET | /api/products | Listar productos |
| Catalog | GET | /api/products/{id} | Obtener producto |
| Checkout | POST | /api/orders | Crear orden |
| Inventory | GET | /api/inventory/{productId} | Ver stock |
| Inventory | PUT | /api/inventory/{productId}/stock | Actualizar stock |

---

## Estado Actual

### ✅ Implementado

- Catálogo de productos desde backend
- Carrito con localStorage compartido
- Contador del carrito en navbar
- Navegación entre MFEs
- Microservicios registrados en Eureka
- CORS configurado para desarrollo

### 🚧 Pendiente

- Integración real de Checkout con RabbitMQ
- Autenticación JWT
- Panel de administración
- Despliegue a producción

---

## Documentación

Ver carpeta `/docs` para guías detalladas:

- `README.md` - Visión general
- `GUIA-INICIO.md` - Pasos para levantar el proyecto
- `ARQUITECTURA.md` - Diagramas y comunicación
- `MFES.md` - Desarrollo de microfrontends
- `MICROSERVICIOS.md` - Desarrollo de microservicios

---

## Créditos

Basado en el PRD: `prd-mini-ecommerce-mfe.md`

---

## Licencia

MIT
