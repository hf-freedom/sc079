package com.rental.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cars")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String plateNumber;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CarType type;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRent;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal deposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CarStatus status;

    @Column(nullable = false)
    private Double mileage;

    @Column(nullable = false)
    private Double fuelLevel;

    @Column(nullable = false)
    private Integer productionYear;

    @Column
    private String color;

    public enum CarType {
        ECONOMY,
        COMPACT,
        SUV,
        LUXURY,
        COMMERCIAL
    }

    public enum CarStatus {
        AVAILABLE,
        RESERVED,
        RENTED,
        MAINTENANCE,
        DAMAGED
    }
}
