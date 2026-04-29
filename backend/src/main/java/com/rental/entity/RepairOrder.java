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
@Table(name = "repair_orders")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RepairOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_order_id", nullable = false)
    private RentalOrder rentalOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepairType type;

    @Column(nullable = false)
    private String description;

    @Column
    private String damageLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DamageLevel damageLevel;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @Column
    private BigDecimal actualCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RepairStatus status;

    @Column
    private LocalDateTime reportedTime;

    @Column
    private LocalDateTime repairStartTime;

    @Column
    private LocalDateTime repairEndTime;

    @Column
    private String repairShop;

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
        if (status == null) {
            status = RepairStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RepairType {
        BODY_DAMAGE,
        MECHANICAL,
        ELECTRICAL,
        INTERIOR,
        OTHER
    }

    public enum DamageLevel {
        MINOR,
        MODERATE,
        SEVERE,
        TOTAL
    }

    public enum RepairStatus {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
}
