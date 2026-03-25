# Mini E-commerce MFE - Documentación

## Visión General

Este proyecto es un **mini e-commerce** implementado con **Microfrontends (MFE)** y **Microservicios**, basado en el PRD definido en `prd-mini-ecommerce-mfe.md`.

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER                                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    mfe-shell (Puerto 9000)                     │   │
│  │   - Navbar con navegación                                     │   │
│  │   - Registro de microfrontends (single-spa)                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐     │
│  │    catalog    │  │   checkout    │  │     (futuros)       │     │
│  │  (Puerto 8501)│  │  (Puerto 8502)│  │                      │     │
│  └──────────────┘  └──────────────┘  └──────────────────────┘     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              localStorage: ecommerce-cart                      │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Puerto 8080)                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              ms-gateway (Puerto 8080)                         │   │
│  │         Spring Cloud Gateway - Punto de entrada               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│         ┌──────────────────────────┼──────────────────────────┐     │
│         │                          │                          │     │
│         ▼                          ▼                          ▼     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ ms-catalog      │    │ ms-checkout     │    │ ms-inventory    │  │
│  │ (Puerto 8081)  │    │ (Puerto 8082)   │    │ (Puerto 8083)   │  │
│  │                 │    │                 │    │                 │  │
│  │ - Productos    │    │ - Órdenes       │    │ - Stock         │  │
│  │ - Categorías    │    │ - Proceso pago  │    │ - Cons. RabbitMQ│  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│         │                          │                          │     │
│         ▼                          ▼                          ▼     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ MySQL: catalog  │    │ MySQL: checkout │    │ MySQL: inventory│  │
│  │ (Puerto 3306)   │    │ (Puerto 3307)   │    │ (Puerto 3308)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              RabbitMQ (Puerto 5672/15672)                    │    │
│  │         message broker para eventos asíncronos               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │              ms-eureka (Puerto 8761)                        │    │
│  │         Netflix Eureka - Service Discovery                   │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Estructura del Proyecto

```
e-commerce/
├── mfe-shell/              # Root config de single-spa (Puerto 9000)
├── catalog/                # Microfrontend de catálogo (Puerto 8501)
├── checkout/               # Microfrontend de carrito/checkout (Puerto 8502)
├── ms-eureka/             # Servidor Eureka (Puerto 8761)
├── ms-gateway/            # API Gateway (Puerto 8080)
├── ms-catalog-service/    # Servicio de catálogo (Puerto 8081)
├── ms-checkout-service/   # Servicio de checkout (Puerto 8082)
├── ms-inventory-service/  # Servicio de inventario (Puerto 8083)
├── docker-compose.yml      # Infraestructura (MySQL, RabbitMQ)
├── docs/                  # Documentación
└── prd-mini-ecommerce-mfe.md  # Especificación del proyecto
```

## Tecnologías

### Frontend
- **React 17** - Framework de UI
- **single-spa** - Orquestación de microfrontends
- **Webpack 5** - Bundling
- **SystemJS** - Carga de módulos

### Backend
- **Spring Boot 3.2** - Framework Java
- **Spring Cloud 2023.0** - Ecosistema de microservicios
- **Spring Data JPA** - Persistencia
- **Flyway** - Migraciones de BD

### Infraestructura
- **MySQL 8.4** - Base de datos por servicio
- **RabbitMQ 3.13** - Message broker
- **Docker** - Contenedores

## Servicios y Puertos

| Componente | Puerto | Descripción |
|------------|--------|-------------|
| mfe-shell | 9000 | Root config + Navbar |
| catalog MFE | 8501 | Catálogo de productos |
| checkout MFE | 8502 | Carrito y checkout |
| ms-eureka | 8761 | Service discovery |
| ms-gateway | 8080 | API Gateway |
| ms-catalog | 8081 | API de productos |
| ms-checkout | 8082 | API de órdenes |
| ms-inventory | 8083 | API de inventario |
| MySQL Catalog | 3306 | Base de datos catálogo |
| MySQL Checkout | 3307 | Base de datos checkout |
| MySQL Inventory | 3308 | Base de datos inventario |
| RabbitMQ | 5672 | Message broker |
| RabbitMQ Admin | 15672 | UI de RabbitMQ |

## Siguientes Pasos

Para continuar el desarrollo, consulta:
- [Guía de Inicio](./GUIA-INICIO.md) - Cómo levantar el proyecto
- [Arquitectura](./ARQUITECTURA.md) - Detalles técnicos
- [Microfrontends](./MFES.md) - Desarrollo frontend
- [Microservicios](./MICROSERVICIOS.md) - Desarrollo backend
