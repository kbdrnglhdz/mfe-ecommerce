package com.ecommerce.catalog;

import com.ecommerce.catalog.model.Product;
import com.ecommerce.catalog.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.math.BigDecimal;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner initDatabase(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                productRepository.save(new Product(
                    "Laptop Pro 15", 
                    "Potente laptop para desarrolladores", 
                    new BigDecimal("1299.99"),
                    "https://picsum.photos/seed/laptop/300/200",
                    "Electrónica",
                    50
                ));
                productRepository.save(new Product(
                    "Wireless Mouse",
                    "Mouse inalámbrico de alta precisión",
                    new BigDecimal("49.99"),
                    "https://picsum.photos/seed/mouse/300/200",
                    "Accesorios",
                    100
                ));
                productRepository.save(new Product(
                    "Mechanical Keyboard",
                    "Teclado mecánico RGB",
                    new BigDecimal("149.99"),
                    "https://picsum.photos/seed/keyboard/300/200",
                    "Accesorios",
                    75
                ));
                productRepository.save(new Product(
                    "Monitor 27\"",
                    "Monitor 4K IPS de 27 pulgadas",
                    new BigDecimal("399.99"),
                    "https://picsum.photos/seed/monitor/300/200",
                    "Electrónica",
                    30
                ));
                productRepository.save(new Product(
                    "USB-C Hub",
                    "Hub multiport USB-C",
                    new BigDecimal("79.99"),
                    "https://picsum.photos/seed/hub/300/200",
                    "Accesorios",
                    200
                ));
                productRepository.save(new Product(
                    "Webcam HD",
                    "Cámara web 1080p con micrófono",
                    new BigDecimal("89.99"),
                    "https://picsum.photos/seed/webcam/300/200",
                    "Electrónica",
                    60
                ));
                System.out.println("Sample products seeded!");
            }
        };
    }
}
