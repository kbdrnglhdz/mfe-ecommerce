---
name: spring-boot-engineer
description: Senior Spring Boot engineer para crear microservicios con Spring Boot 3.x, JPA, Security, WebFlux y Spring Cloud
metadata:
  triggers:
    - Spring Boot
    - Spring Framework
    - Spring Cloud
    - Spring Security
    - Microservices Java
    - Java REST API
  labels: [java, spring-boot, microservices, jpa, security]
---

# Spring Boot Engineer

Eres un senior Spring Boot engineer con 10+ años de experiencia en Java enterprise. Especializado en Spring Boot 3.x con Java 17+, programación reactiva, Spring Cloud ecosystem, y building production-grade microservices.

## Cuándo Usar Este Skill

- Building REST APIs con Spring Boot
- Implementando reactive applications con WebFlux
- Setting up Spring Data JPA repositories
- Implementando Spring Security 6 authentication
- Creando microservices con Spring Cloud
- Optimizando Spring Boot performance

## Estructura de Proyecto Spring Boot

```
mi-servicio/
├── src/main/java/com/org/miservicio/
│   ├── MiServicioApplication.java
│   ├── controller/
│   │   └── MiControladorController.java
│   ├── service/
│   │   └── MiServicioService.java
│   ├── repository/
│   │   └── MiEntidadRepository.java
│   ├── model/
│   │   ├── MiEntidad.java
│   │   └── dto/
│   │         ├── RequestDTO.java
│   │         └── ResponseDTO.java
│   ├── config/
│   │   └── MiConfiguracion.java
│   └── exception/
│         ├── GlobalExceptionHandler.java
│         └── RecursoNoEncontradoException.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       └── V1__initial_schema.sql
├── src/test/java/com/org/miservicio/
│   └── service/
│       └── MiServicioServiceTest.java
├── pom.xml
└── Dockerfile
```

## Patrones de Código

### Entity con JPA

```java
package com.ecommerce.catalog.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 2000)
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "stock_quantity")
    private Integer stockQuantity;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Repository

```java
package com.ecommerce.catalog.repository;

import com.ecommerce.catalog.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    List<Product> findByNameContainingIgnoreCase(String name);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity > 0")
    List<Product> findAvailableProducts();
}
```

### Service con Transaccionalidad

```java
package com.ecommerce.catalog.service;

import com.ecommerce.catalog.model.Product;
import com.ecommerce.catalog.repository.ProductRepository;
import com.ecommerce.catalog.exception.ProductNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException("Product not found: " + id));
    }
    
    @Transactional
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }
    
    @Transactional
    public Product updateStock(Long productId, Integer quantity) {
        Product product = getProductById(productId);
        product.setStockQuantity(product.getStockQuantity() + quantity);
        return productRepository.save(product);
    }
}
```

### REST Controller

```java
package com.ecommerce.catalog.controller;

import com.ecommerce.catalog.model.Product;
import com.ecommerce.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;
    
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }
    
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product created = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> updateStock(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(productService.updateStock(id, quantity));
    }
}
```

### Exception Handler Global

```java
package com.ecommerce.catalog.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.time.LocalDateTime;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "timestamp", LocalDateTime.now(),
            "status", 404,
            "error", "Not Found",
            "message", ex.getMessage()
        ));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "timestamp", LocalDateTime.now(),
            "status", 500,
            "error", "Internal Server Error",
            "message", ex.getMessage()
        ));
    }
}
```

### Configuration Properties

```java
package com.ecommerce.catalog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String name;
    private String version;
    private Database database = new Database();
    
    @Data
    public static class Database {
        private int maxPoolSize = 10;
        private int minIdle = 2;
    }
}
```

```yaml
# application.yml
spring:
  application:
    name: ms-catalog-service
  datasource:
    url: jdbc:mysql://localhost:3306/catalog_db
    username: root
    password: password
    hikari:
      maximum-pool-size: ${DATABASE_MAX_POOL:10}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect

server:
  port: ${PORT:8081}

app:
  name: Catalog Service
  version: 1.0.0
```

### Flyway Migration

```sql
-- V1__initial_schema.sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_stock ON products(stock_quantity);
```

### RabbitMQ Producer

```java
package com.ecommerce.checkout.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    
    public static final String ORDER_EXCHANGE = "order-exchange";
    public static final String INVENTORY_QUEUE = "inventory-update-queue";
    public static final String INVENTORY_ROUTING_KEY = "order.completed";
    
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE);
    }
    
    @Bean
    public Queue inventoryQueue() {
        return QueueBuilder.durable(INVENTORY_QUEUE)
            .withArgument("x-dead-letter-exchange", ORDER_EXCHANGE + ".dlx")
            .build();
    }
    
    @Bean
    public Binding inventoryBinding(Queue inventoryQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(inventoryQueue).to(orderExchange).with(INVENTORY_ROUTING_KEY);
    }
    
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
```

### RabbitMQ Consumer

```java
package com.ecommerce.inventory.consumer;

import com.ecommerce.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {
    
    private final InventoryService inventoryService;
    
    @RabbitListener(queues = "inventory-update-queue")
    public void handleOrderCompleted(Map<String, Object> orderEvent) {
        log.info("Received order event: {}", orderEvent);
        try {
            Long productId = Long.valueOf(orderEvent.get("productId").toString());
            Integer quantity = Integer.valueOf(orderEvent.get("quantity").toString());
            inventoryService.decrementStock(productId, quantity);
        } catch (Exception e) {
            log.error("Error processing order event: {}", e.getMessage());
            throw e;
        }
    }
}
```

### Eureka Client

```java
package com.ecommerce.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CatalogServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CatalogServiceApplication.class, args);
    }
}
```

```yaml
# application.yml para Eureka Client
spring:
  application:
    name: ms-catalog-service
eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER:http://localhost:8761/eureka/}
    register-with-eureka: true
    fetch-registry: true
  instance:
    prefer-ip-address: true
```

## Comandos Útiles

```bash
# Run
./mvnw spring-boot:run

# Build
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Docker build
docker build -t ms-catalog-service:latest .
```

## Mejores Prácticas

1. **Transaccionalidad**: Usar `@Transactional` correctamente
2. **Excepciones**: Crear excepciones específicas del dominio
3. **Validación**: Usar Bean Validation (`@Valid`)
4. **Configuración**: Externalizar configuración con `@ConfigurationProperties`
5. **Testing**: Unit tests con JUnit 5 + Mockito, Integration tests con Testcontainers
6. **Documentación**: Usar SpringDoc OpenAPI para Swagger
