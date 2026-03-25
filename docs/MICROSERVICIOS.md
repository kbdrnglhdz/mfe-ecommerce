# Microservicios

## Visión General

El backend está construido con **Spring Boot 3.2** y **Spring Cloud 2023.0**, usando una arquitectura de microservicios con:
- **Eureka** para service discovery
- **API Gateway** para enrutamiento
- **RabbitMQ** para mensajería asíncrona
- **Flyway** para migraciones de BD
- **JPA/Hibernate** para persistencia

## Estructura de un Microservicio

```
ms-catalog-service/
├── src/main/java/com/ecommerce/catalog/
│   ├── CatalogServiceApplication.java    # Main class
│   ├── controller/
│   │   └── ProductController.java         # REST endpoints
│   ├── service/
│   │   └── ProductService.java            # Lógica de negocio
│   ├── repository/
│   │   └── ProductRepository.java         # JPA repository
│   ├── model/
│   │   └── Product.java                   # Entity
│   └── config/
│       └── CorsFilter.java                 # CORS config
├── src/main/resources/
│   ├── application.yml                     # Configuración
│   └── db/migration/
│       └── V1__initial_schema.sql         # Flyway migration
└── pom.xml
```

## Dependencias (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    
    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2023.0.0</spring-cloud.version>
    </properties>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        
        <!-- MySQL -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
        </dependency>
        
        <!-- Flyway -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        
        <!-- Eureka Client -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>
        
        <!-- RabbitMQ -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
        
        <!-- Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>
</project>
```

## Configuración (application.yml)

```yaml
server:
  port: 8081

spring:
  application:
    name: ms-catalog-service
  datasource:
    url: jdbc:mysql://localhost:3306/catalog_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate    # Importante: validate, no update
    show-sql: false
  flyway:
    enabled: true
    baseline-on-migrate: true

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
  instance:
    prefer-ip-address: true

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

## Entity (JPA)

```java
package com.ecommerce.catalog.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
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
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    private String category;
    
    @Column(name = "stock_quantity")
    private Integer stockQuantity;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors...
}
```

## Repository

```java
package com.ecommerce.catalog.repository;

import com.ecommerce.catalog.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);
}
```

## Service

```java
package com.ecommerce.catalog.service;

import com.ecommerce.catalog.model.Product;
import com.ecommerce.catalog.repository.ProductRepository;
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
            .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }
}
```

## REST Controller

```java
package com.ecommerce.catalog.controller;

import com.ecommerce.catalog.model.Product;
import com.ecommerce.catalog.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
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
}
```

## CORS Filter

```java
package com.ecommerce.catalog.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
@Order(1)
public class CorsFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        httpResponse.setHeader("Access-Control-Allow-Origin", "http://localhost:9000");
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        httpResponse.setHeader("Access-Control-Allow-Headers", "*");
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
        } else {
            chain.doFilter(request, response);
        }
    }
}
```

## Flyway Migration

```sql
-- V1__initial_schema.sql
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_stock ON products(stock_quantity);
```

## RabbitMQ Producer (Checkout Service)

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
        return QueueBuilder.durable(INVENTORY_QUEUE).build();
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

```java
// Enviar mensaje
@Autowired
private RabbitTemplate rabbitTemplate;

public void sendOrderEvent(Order order) {
    Map<String, Object> event = Map.of(
        "orderId", order.getId(),
        "productId", order.getProductId(),
        "quantity", order.getQuantity()
    );
    rabbitTemplate.convertAndSend("order-exchange", "order.completed", event);
}
```

## RabbitMQ Consumer (Inventory Service)

```java
package com.ecommerce.inventory.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {
    
    @RabbitListener(queues = "inventory-update-queue")
    public void handleOrderCompleted(Map<String, Object> event) {
        log.info("Received order event: {}", event);
        try {
            Long productId = Long.valueOf(event.get("productId").toString());
            Integer quantity = Integer.valueOf(event.get("quantity").toString());
            // Decrementar stock en BD
        } catch (Exception e) {
            log.error("Error processing order event: {}", e.getMessage());
            throw e;
        }
    }
}
```

## API Gateway (ms-gateway)

El Gateway usa Spring Cloud Gateway para enrutar peticiones:

```yaml
# application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: catalog-service
          uri: lb://ms-catalog-service
          predicates:
            - Path=/api/products/**
        - id: checkout-service
          uri: lb://ms-checkout-service
          predicates:
            - Path=/api/orders/**
        - id: inventory-service
          uri: lb://ms-inventory-service
          predicates:
            - Path=/api/inventory/**
```

## Comandos

```bash
# Run
cd ms-catalog-service
mvn spring-boot:run

# Build
mvn clean package -DskipTests

# Ver logs
tail -f /tmp/catalog.log
```

## Servicios Existentes

| Servicio | Puerto | Puerto MySQL | Funcionalidad |
|----------|--------|--------------|---------------|
| ms-eureka | 8761 | - | Service Discovery |
| ms-gateway | 8080 | - | API Gateway |
| ms-catalog | 8081 | 3306 | Productos |
| ms-checkout | 8082 | 3307 | Órdenes |
| ms-inventory | 8083 | 3308 | Stock |

## Agregar un Nuevo Microservicio

1. Crear proyecto Spring Boot
2. Agregar dependencias (JPA, Eureka, MySQL, Flyway)
3. Configurar application.yml con puerto único
4. Agregar a Eureka (@EnableDiscoveryClient)
5. Crear entity, repository, service, controller
6. Agregar Flyway migration
7. Configurar CORS
8. Agregar ruta en Gateway
