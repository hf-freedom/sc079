package com.rental.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rental_orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RentalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private LocalDateTime reservationTime;

    @Column
    private LocalDateTime pickupTime;

    @Column
    private LocalDateTime expectedReturnTime;

    @Column
    private LocalDateTime actualReturnTime;

    @Column(nullable = false)
    private Integer expectedDays;

    @Column
    private Integer actualDays;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyRent;

    @Column
    private Double pickupMileage;

    @Column
    private Double returnMileage;

    @Column
    private Double extraMileage;

    @Column
    private Double pickupFuelLevel;

    @Column
    private Double returnFuelLevel;

    @Column
    private Double fuelDeficit;

    @Column(nullable = false)
    private Boolean hasInsurance;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal frozenDeposit;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal frozenRent;

    @Column
    private BigDecimal totalRent;

    @Column
    private BigDecimal mileageFee;

    @Column
    private BigDecimal fuelFee;

    @Column
    private BigDecimal damageFee;

    @Column
    private BigDecimal insuranceCoverage;

    @Column
    private BigDecimal overdueFee;

    @Column
    private BigDecimal totalAmount;

    @Column
    private BigDecimal paidAmount;

    @Column
    private LocalDateTime violationObservationEndTime;

    @Column
    private BigDecimal remainingDeposit;

    @Column
    private Boolean depositReleased;

    @Column
    private String remark;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        depositReleased = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum OrderStatus {
        RESERVED,
        PICKED_UP,
        RETURNED,
        SETTLED,
        CANCELLED
    }
}
