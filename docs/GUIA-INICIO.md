# Guía de Inicio

Esta guía te permite levantar todo el proyecto desde cero.

## Prerrequisitos

- **Java 17+**: Required para Spring Boot 3.x
- **Maven 3.8+**: Para compilar microservicios
- **Node.js 18+**: Para microfrontends
- **Docker Desktop**: Para infraestructura

## Paso 1: Levantar Infraestructura

```bash
cd e-commerce
docker-compose up -d
```

Esto crea:
- 3 contenedores MySQL (catalog, checkout, inventory)
- 1 contenedor RabbitMQ

Verificar que estén运行:
```bash
docker ps
```

## Paso 2: Instalar Maven (si no tienes)

```bash
# Instalar SDKMAN
curl -s "https://get.sdkman.io" | bash
source ~/.sdkman/bin/sdkman-init.sh

# Instalar Maven
sdk install maven
```

Verificar:
```bash
mvn --version
```

## Paso 3: Iniciar Microservicios

Los microservicios deben iniciarse en orden (Eureka primero).

### Terminal 1: Eureka Server
```bash
cd ms-eureka
mvn spring-boot:run
```

### Terminal 2: API Gateway
```bash
cd ms-gateway
mvn spring-boot:run
```

### Terminal 3: Catalog Service
```bash
cd ms-catalog-service
mvn spring-boot:run
```

### Terminal 4: Checkout Service
```bash
cd ms-checkout-service
mvn spring-boot:run
```

### Terminal 5: Inventory Service
```bash
cd ms-inventory-service
mvn spring-boot:run
```

## Paso 4: Iniciar Microfrontends

### Terminal 6: Shell (Root Config)
```bash
cd mfe-shell
npm install  # Solo la primera vez
npm start
```

### Terminal 7: Catalog MFE
```bash
cd catalog
npm install  # Solo la primera vez
npm start
```

### Terminal 8: Checkout MFE
```bash
cd checkout
npm install  # Solo la primera vez
npm start
```

## Paso 5: Acceder a la Aplicación

| Servicio | URL |
|----------|-----|
| Aplicación | http://localhost:9000 |
| Eureka Dashboard | http://localhost:8761 |
| RabbitMQ Admin | http://localhost:15672 (guest/guest) |

## Verificar que Todo Funciona

1. **Eureka**: http://localhost:8761 - Deberías ver 4 servicios registrados
2. **API Catalog**: `curl http://localhost:8081/api/products`
3. **App**: http://localhost:9000 - Navega a Catálogo y verifica productos

## Comandos Útiles

### Ver logs de un servicio
```bash
# Microservicios
tail -f /tmp/catalog.log

# MFEs
tail -f /tmp/catalog-mfe.log
```

### Reiniciar un servicio
```bash
# Matar proceso
pkill -f "ms-catalog-service"

# Reiniciar
cd ms-catalog-service && mvn spring-boot:run
```

### Detener todo
```bash
# MFEs
pkill -f "npm start"

# Microservicios
pkill -f "spring-boot:run"

# Docker
docker-compose down
```

## Problemas Comunes

### "Port already in use"
```bash
# Encontrar proceso
lsof -ti:8081

# Matar
kill -9 <PID>
```

### "Database does not exist"
- MySQL necesita tiempo para inicializar
- Espera 10 segundos y reintenta

### "CORS error" en navegador
- Verifica que el servicio de catálogo esté ejecutándose
- Revisa que CORS esté configurado (ver docs/MICROSERVICIOS.md)
