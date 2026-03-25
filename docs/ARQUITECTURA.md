# Arquitectura

## Visión General

Este proyecto implementa una arquitectura de **microfrontends** en el frontend y **microservicios** en el backend, comunicados mediante APIs REST y mensajería asíncrona.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         mfe-shell:9000                                │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ Navbar (React)                                                │   │   │
│  │  │ - Navegación entre rutas                                      │   │   │
│  │  │ - Carrito: lee localStorage + actualiza contador             │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐                                 │   │
│  │  │  /catalog   │  │ /checkout   │                                 │   │
│  │  │ (MFE React) │  │ (MFE React) │                                 │   │
│  │  └─────────────┘  └─────────────┘                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    localStorage: ecommerce-cart                      │   │
│  │  [{"id":1,"name":"Producto","price":99.99,"quantity":1},...]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│         CATALOG MFE:8501        │  │        CHECKOUT MFE:8502        │
│                                 │  │                                 │
│  - Fetch a API REST             │  │  - Lee localStorage             │
│  - Muestra productos            │  │  - Muestra items en carrito     │
│  - "Agregar al Carrito"         │  │  - Checkout (demo)             │
│    → escribe localStorage       │  │  → limpia localStorage          │
└─────────────────────────────────┘  └─────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────────┐
                    │              API GATEWAY:8080             │
                    │  Routeo: /api/* → servicios internos     │
                    └───────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ ms-catalog    │         │ ms-checkout   │         │ms-inventory   │
│    :8081      │         │    :8082      │         │    :8083      │
│               │         │               │         │               │
│ GET /products │         │ POST /orders  │         │ Stock mgmt    │
│               │         │               │         │               │
│               │         │    RabbitMQ   │         │ RabbitMQ      │
│               │         │  (producer)   │         │  (consumer)   │
└───────────────┘         └───────────────┘         └───────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ MySQL:3306    │         │ MySQL:3307    │         │ MySQL:3308    │
│ catalog_db    │         │ checkout_db   │         │ inventory_db  │
└───────────────┘         └───────────────┘         └───────────────┘
```

## Comunicación Frontend → Backend

### Catálogo de Productos

```javascript
// catalog/src/EcommerceCatalog.jsx
const API_URL = "http://localhost:8081/api/products";

useEffect(() => {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => setProducts(data));
}, []);
```

### Carrito (localStorage)

```javascript
// Guardar
const addToCart = (product) => {
  const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
  cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
  localStorage.setItem('ecommerce-cart', JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart:updated'));
};

// Leer
const cart = JSON.parse(localStorage.getItem('ecommerce-cart') || '[]');
```

### Eventos del Carrito

| Evento | Disparado por | Escuchado por |
|--------|---------------|---------------|
| `cart:updated` | Catalog, Checkout | Navbar (mfe-shell) |
| `storage` | Browser | Navbar (mfe-shell) |

## Comunicación Backend → Microservicios

### through API Gateway

```
Gateway (8080)
  ├── /api/catalog/**   → ms-catalog:8081
  ├── /api/checkout/**  → ms-checkout:8082  
  └── /api/inventory/** → ms-inventory:8083
```

### through RabbitMQ (Eventos)

```
┌──────────────┐     order-exchange      ┌─────────────────────┐
│  checkout    │ ──────────────────────► │ inventory-update-   │
│  service     │    (topic)             │     queue           │
└──────────────┘                         └─────────────────────┘
                                                     │
                                                     ▼
                                            ┌──────────────┐
                                            │  inventory    │
                                            │  service      │
                                            └──────────────┘
```

**Flujo:**
1. Usuario completa checkout
2. Checkout service crea orden en BD
3. Checkout service envía evento a RabbitMQ
4. Inventory service escucha y descuenta stock

## Base de Datos por Servicio

Cada microservicio tiene su propia BD MySQL:

| Servicio | BD | Tablas |
|----------|-----|--------|
| ms-catalog | catalog_db | products, categories |
| ms-checkout | checkout_db | orders, order_items |
| ms-inventory | inventory_db | inventory |

## CORS Configuration

Los MFEs runs en puertos diferentes, entonces el backend debe permitir CORS:

```java
// ms-catalog-service/src/main/java/.../config/CorsFilter.java
@Component
@Order(1)
public class CorsFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        httpResponse.setHeader("Access-Control-Allow-Origin", "http://localhost:9000");
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        httpResponse.setHeader("Access-Control-Allow-Headers", "*");
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        chain.doFilter(request, response);
    }
}
```

## Service Discovery (Eureka)

Todos los servicios se registran en Eureka:

```
Eureka Dashboard: http://localhost:8761

Aplicaciones registradas:
├── MS-CATALOG-SERVICE
├── MS-CHECKOUT-SERVICE
├── MS-INVENTORY-SERVICE
└── MS-GATEWAY
```

## Patrones Implementados

1. **API Gateway Pattern**: Gateway como único punto de entrada
2. **Database per Service**: Cada servicio su propia BD
3. **Event-Driven**: RabbitMQ para comunicación asíncrona
4. **MFE with Shell**: single-spa para orquestar microfrontends
5. **Shared Nothing**: localStorage para estado compartido del carrito
