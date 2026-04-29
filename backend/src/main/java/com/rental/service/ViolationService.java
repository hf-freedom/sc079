package com.rental.service;

import com.rental.dto.ViolationImportRequest;
import com.rental.entity.*;
import com.rental.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ViolationService {

    private final ViolationRepository violationRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;

    @Transactional
    public Violation importViolation(ViolationImportRequest request) {
        Car car = carRepository.findByPlateNumber(request.getPlateNumber())
                .orElseThrow(() -> new RuntimeException("车辆不存在: " + request.getPlateNumber()));

        RentalOrder relatedOrder = findRelatedOrder(car, request.getViolationTime());

        User user = relatedOrder != null ? relatedOrder.getUser() : null;

        Violation violation = Violation.builder()
                .rentalOrder(relatedOrder)
                .user(user)
                .car(car)
                .violationTime(request.getViolationTime())
                .location(request.getLocation())
                .type(request.getType())
                .fineAmount(request.getFineAmount())
                .penaltyPoints(request.getPenaltyPoints())
                .status(Violation.ViolationStatus.PENDING)
                .source(request.getSource())
                .remark(request.getRemark())
                .build();

        violation = violationRepository.save(violation);

        if (relatedOrder != null && user != null) {
            deductViolationFromDeposit(relatedOrder, violation);
            
            user.setViolationCount(user.getViolationCount() + 1);
            updateCreditLevel(user);
            userRepository.save(user);
        }

        return violation;
    }

    private RentalOrder findRelatedOrder(Car car, LocalDateTime violationTime) {
        List<RentalOrder> orders = rentalOrderRepository.findByCarId(car.getId());
        
        for (RentalOrder order : orders) {
            if (order.getPickupTime() == null) continue;
            
            LocalDateTime orderStart = order.getPickupTime();
            LocalDateTime orderEnd = order.getActualReturnTime() != null 
                    ? order.getActualReturnTime() 
                    : order.getExpectedReturnTime();
            
            if (!violationTime.isBefore(orderStart) && !violationTime.isAfter(orderEnd)) {
                return order;
            }
        }
        
        return null;
    }

    @Transactional
    public void deductViolationFromDeposit(RentalOrder order, Violation violation) {
        BigDecimal fineAmount = violation.getFineAmount();
        BigDecimal remainingDeposit = order.getRemainingDeposit();
        
        if (remainingDeposit == null) {
            remainingDeposit = order.getFrozenDeposit();
        }
        
        if (remainingDeposit.compareTo(fineAmount) >= 0) {
            BigDecimal newRemaining = remainingDeposit.subtract(fineAmount);
            order.setRemainingDeposit(newRemaining);
            violation.setStatus(Violation.ViolationStatus.PAID);
            violation.setPaidTime(LocalDateTime.now());
            log.info("已从订单 {} 押金中扣除违章罚款 {} 元", order.getOrderNumber(), fineAmount);
        } else {
            if (remainingDeposit.compareTo(BigDecimal.ZERO) > 0) {
                log.warn("订单 {} 押金不足以支付违章罚款，剩余押金: {}, 罚款: {}", 
                        order.getOrderNumber(), remainingDeposit, fineAmount);
            }
        }
        
        rentalOrderRepository.save(order);
        violationRepository.save(violation);
    }

    private void updateCreditLevel(User user) {
        int totalNegative = user.getViolationCount() + user.getOverdueCount() * 2;
        
        if (totalNegative >= 5) {
            user.setCreditLevel(User.CreditLevel.POOR);
            user.setIsBlacklisted(true);
        } else if (totalNegative >= 3) {
            user.setCreditLevel(User.CreditLevel.FAIR);
        } else if (totalNegative >= 1) {
            user.setCreditLevel(User.CreditLevel.GOOD);
        } else {
            user.setCreditLevel(User.CreditLevel.EXCELLENT);
        }
    }

    public List<Violation> getViolationsByUser(Long userId) {
        return violationRepository.findByUserId(userId);
    }

    public List<Violation> getViolationsByOrder(Long orderId) {
        return violationRepository.findByRentalOrderId(orderId);
    }

    public List<Violation> getPendingViolations() {
        return violationRepository.findByStatus(Violation.ViolationStatus.PENDING);
    }
}
