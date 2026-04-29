package com.rental.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String realName;

    @Column(unique = true, nullable = false)
    private String idCard;

    @Column(unique = true, nullable = false)
    private String phone;

    @Column(unique = true, nullable = false)
    private String licenseNumber;

    @Column(nullable = false)
    private LocalDate licenseIssueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CreditLevel creditLevel;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal balance;

    @Column(nullable = false)
    private Boolean isBlacklisted;

    @Column(nullable = false)
    private Integer violationCount;

    @Column(nullable = false)
    private Integer overdueCount;

    public enum CreditLevel {
        EXCELLENT,
        GOOD,
        FAIR,
        POOR
    }
}
