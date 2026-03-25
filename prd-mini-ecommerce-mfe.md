
# PRD: Mini E-commerce Distributed Architecture (MFE + Microservices)

**ID:** PRD-MEC-001  
**Estado:** Final / Listo para Implementación  
**Arquitecto:** Senior Lead  
**Stack:** React TS, Spring Cloud, MySQL, Flyway, RabbitMQ, Docker.

---

## 1. Introducción y Propósito
Este documento define los requerimientos para un mini e-commerce diseñado bajo el principio de **Vertical Slices**. El sistema separa las responsabilidades de descubrimiento de productos (Catálogo) de las transaccionales (Checkout) y de soporte (Inventario), garantizando que un fallo en un módulo no comprometa la operación global.

---

## 2. Objetivos del Producto
* **Modularidad Total:** Independencia de despliegue y desarrollo mediante Microfrontends y Microservicios.
* **Resiliencia de Negocio:** Permitir que la navegación continúe aunque el sistema de pagos esté en mantenimiento.
* **Escalabilidad de Datos:** Implementar el patrón *Database-per-Service* para evitar cuellos de botella en MySQL.

---

## 3. Historias de Usuario (User Stories)
* **US-01:** Como usuario, quiero ver una lista de productos (MFE Catalog) para seleccionar lo que deseo comprar.
* **US-02:** Como usuario, quiero agregar productos al carrito y ver el contador actualizarse (Event-Driven) sin recargar la página.
* **US-03:** Como usuario, quiero completar mi compra (MFE Checkout) y recibir una confirmación inmediata.
* **US-04:** Como administrador, quiero que el stock se descuente automáticamente (RabbitMQ) tras cada venta exitosa.

---

## 4. Requerimientos Funcionales (RF)

| ID | Requerimiento | Descripción | Prioridad |
| :--- | :--- | :--- | :--- |
| **RF-01** | **Navegación de Catálogo** | El MFE Catalog debe listar productos desde `ms-catalog` vía API Gateway. | Crítica |
| **RF-02** | **Comunicación de Carrito** | El MFE Catalog debe emitir un `CustomEvent('cart:add')` con el payload del producto. | Alta |
| **RF-03** | **Gestión de Checkout** | El MFE Checkout debe escuchar el evento de carrito y persistir la orden en `ms-checkout`. | Crítica |
| **RF-04** | **Sincronización de Stock** | Al confirmar el pago, `ms-checkout` debe notificar a `ms-inventory` de forma asíncrona. | Alta |
| **RF-05** | **Autenticación Distribuida** | Cada micro-app debe validar el JWT del usuario contra el servicio de identidad centralizado. | Crítica |

---

## 5. Requerimientos Técnicos (RT)

### 5.1 Arquitectura de Frontend (Microfrontends)
* **Tecnología:** React 18+ con TypeScript.
* **Orquestación:** Webpack 5 **Module Federation**.
* **Aislamiento:** Uso de **CSS Modules** para evitar colisiones de estilos entre MFEs.
* **Estrategia de Fallo:** El Shell debe implementar *Error Boundaries* para ocultar módulos que no carguen (404/500).

### 5.2 Arquitectura de Backend (Microservicios)
* **Framework:** Spring Boot 3.x / Spring Cloud.
* **Discovery:** **Netflix Eureka** para registro de servicios.
* **Gateway:** **Spring Cloud Gateway** como único punto de entrada (Puerto 8080).
* **Configuración:** **Spring Cloud Config** para manejo de perfiles (`dev`, `prod`).

### 5.3 Persistencia y Mensajería
* **Base de Datos:** MySQL 8.0 (Un esquema independiente por servicio).
* **Migraciones:** **Flyway** integrado en el ciclo de vida de Spring Boot (scripts en `V1__initial_schema.sql`).
* **Broker de Mensajes:** **RabbitMQ**.
    * *Exchange:* `order-exchange` (Topic).
    * *Queue:* `inventory-update-queue`.

---

## 6. Estrategia de Desarrollo y DevOps

### 6.1 Gestión de Repositorios (Multirepo)
Cada componente vive en su propio repositorio Git para permitir pipelines de CI/CD independientes:
1.  `mfe-shell`
2.  `mfe-catalog`
3.  `mfe-checkout`
4.  `ms-gateway-discovery`
5.  `ms-catalog-service`
6.  `ms-checkout-service`
7.  `ms-inventory-service`

### 6.2 Flujo de Trabajo
* **Git Worktrees:** Recomendado para trabajar en `hotfixes` sin abandonar la rama de `feature` actual.
* **Orquestación Local:** Repositorio de infraestructura con un `docker-compose.yml` que levante RabbitMQ, MySQL y Eureka.

---

## 7. No Objetivos (Fuera de Alcance)
* No se implementará Server Side Rendering (SSR) en esta fase.
* No se compartirá la base de datos de Catálogo con el servicio de Inventario (comunicación solo vía API o Eventos).
* No se incluye el panel administrativo de carga de productos.

---

## 8. Métricas de Éxito
1.  **Time to Interactive (TTI):** Menor a 2 segundos para el MFE de Catálogo.
2.  **Consistencia de Datos:** El 100% de los eventos de RabbitMQ deben ser procesados o enviados a una *Dead Letter Queue* en caso de error.
3.  **Independencia:** El equipo de Checkout debe poder desplegar sin que el equipo de Catalog esté enterado.

---