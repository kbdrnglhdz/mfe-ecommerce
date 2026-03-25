---
name: microservices
description: Estándares para comunicación sincrona (Feign) y asíncrona (RabbitMQ/Kafka) en microservicios Spring Boot
metadata:
  labels: [microservices, feign, rabbitmq, kafka, spring-cloud]
  triggers:
    - feign-client
    - spring-cloud-stream
    - rabbitmq
    - kafka
---

# Microservices Standards

## Prioridad: P0

## Communication Patterns

### 1. Synchronous (REST) - Feign Client

```java
package com.ecommerce.checkout.client;

import com.ecommerce.catalog.dto.ProductResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;

@FeignClient(name = "ms-catalog-service", path = "/api/v1/products")
public interface CatalogClient {
    
    @GetMapping("/{id}")
    ProductResponse getProductById(@PathVariable("id") Long id);
    
    @GetMapping
    List<ProductResponse> getAllProducts();
}
```

### 2. Circuit Breaker with Resilience4j

```java
package com.ecommerce.checkout.client;

import com.ecommerce.catalog.dto.ProductResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.List;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

@FeignClient(name = "ms-catalog-service", path = "/api/v1/products")
public interface CatalogClient {
    
    @GetMapping("/{id}")
    @CircuitBreaker(name = "catalogService", fallbackMethod = "getProductFallback")
    ProductResponse getProductById(@PathVariable("id") Long id);
    
    default ProductResponse getProductFallback(Long id, Exception e) {
        return ProductResponse.builder()
            .id(id)
            .name("Product unavailable")
            .build();
    }
}
```

### 3. Asynchronous (Event-Driven) - RabbitMQ

#### Producer

```java
package com.ecommerce.checkout.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {
    
    private final RabbitTemplate rabbitTemplate;
    
    public void publishOrderCompleted(Long orderId, Long productId, Integer quantity) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "ORDER_COMPLETED");
        event.put("orderId", orderId);
        event.put("productId", productId);
        event.put("quantity", quantity);
        event.put("timestamp", System.currentTimeMillis());
        
        rabbitTemplate.convertAndSend(
            "order-exchange",
            "order.completed",
            event
        );
        
        log.info("Published ORDER_COMPLETED event for order: {}", orderId);
    }
}
```

#### Consumer (Idempotent)

```java
package com.ecommerce.inventory.consumer;

import com.ecommerce.inventory.service.InventoryService;
import com.ecommerce.inventory.repository.EventProcessedRepository;
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
    private final EventProcessedRepository eventProcessedRepository;
    
    @RabbitListener(queues = "inventory-update-queue")
    public void handleOrderCompleted(Map<String, Object> event) {
        String eventId = event.get("eventType") + "_" + event.get("orderId");
        
        if (eventProcessedRepository.existsByEventId(eventId)) {
            log.info("Event {} already processed, skipping", eventId);
            return;
        }
        
        try {
            Long productId = Long.valueOf(event.get("productId").toString());
            Integer quantity = Integer.valueOf(event.get("quantity").toString());
            
            inventoryService.decrementStock(productId, quantity);
            
            eventProcessedRepository.save(new EventProcessed(eventId));
            log.info("Successfully processed event: {}", eventId);
            
        } catch (Exception e) {
            log.error("Error processing event: {}", e.getMessage());
            throw e;
        }
    }
}
```

#### Dead Letter Queue

```java
@Bean
public Queue inventoryQueue() {
    return QueueBuilder.durable("inventory-update-queue")
        .withArgument("x-dead-letter-exchange", "order-exchange.dlx")
        .withArgument("x-dead-letter-routing-key", "inventory.dead")
        .build();
}

@Bean
public Queue deadLetterQueue() {
    return QueueBuilder.durable("inventory-update-queue.dlq").build();
}
```

### 4. Spring Cloud Gateway

```yaml
# application.yml
spring:
  application:
    name: ms-gateway
  cloud:
    gateway:
      routes:
        - id: catalog-service
          uri: lb://ms-catalog-service
          predicates:
            - Path=/api/v1/catalog/**
          filters:
            - StripPrefix=1
        
        - id: checkout-service
          uri: lb://ms-checkout-service
          predicates:
            - Path=/api/v1/checkout/**
          filters:
            - StripPrefix=1
        
        - id: inventory-service
          uri: lb://ms-inventory-service
          predicates:
            - Path=/api/v1/inventory/**
          filters:
            - StripPrefix=1

      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
        - Name=RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate=10
            redis-rate-limiter.burstCapacity=20

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### 5. JWT Validation in Gateway

```java
package com.ecommerce.gateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {
    
    public JwtAuthenticationFilter() {
        super(Config.class);
    }
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            
            String token = authHeader.substring(7);
            
            if (!isValidToken(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            
            return chain.filter(exchange);
        };
    }
    
    private boolean isValidToken(String token) {
        return true;
    }
    
    public static class Config {}
}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Solution |
|--------------|----------|
| Shared Entities | Use DTOs - No shared database tables |
| Sync Chains | Use Async - Prefer event-driven |
| Tight Coupling | Loose coupling via events |
| Distributed Monolith | True independent deployments |

## Event Schema Evolution

```json
// V1 - Initial
{
  "eventType": "ORDER_COMPLETED",
  "orderId": 123,
  "productId": 456,
  "quantity": 2
}

// V2 - Add new field (BACKWARD COMPATIBLE)
{
  "eventType": "ORDER_COMPLETED",
  "orderId": 123,
  "productId": 456,
  "quantity": 2,
  "userId": 789,
  "timestamp": "2026-03-24T10:00:00Z"
}

// NEVER remove fields - always add new ones
// NEVER rename existing fields
```

## Idempotency Implementation

```java
@Entity
@Table(name = "processed_events")
public class EventProcessed {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "event_id", unique = true, nullable = false)
    private String eventId;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}

@Repository
public interface EventProcessedRepository extends JpaRepository<EventProcessed, Long> {
    boolean existsByEventId(String eventId);
}
```

## Service Discovery (Eureka)

```
┌─────────────────────────────────────────────────────────────┐
│                     EUREKA SERVER (8761)                    │
├─────────────────────────────────────────────────────────────┤
│  ms-catalog-service    → 192.168.1.10:8081                 │
│  ms-checkout-service   → 192.168.1.11:8082                 │
│  ms-inventory-service  → 192.168.1.12:8083                 │
└─────────────────────────────────────────────────────────────┘
```

## Health Check

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```

## Best Practices Summary

1. **Database per Service** - Never share databases
2. **Async Communication** - Prefer RabbitMQ over direct HTTP calls
3. **Circuit Breaker** - Always wrap external calls with Resilience4j
4. **Idempotent Consumers** - Handle duplicate messages gracefully
5. **Event Schema Evolution** - Only ADD fields, never remove
6. **JWT at Gateway** - Centralize auth in API Gateway
7. **Health Checks** - Implement proper health endpoints
