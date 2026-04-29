package com.rental.service;

import com.rental.dto.PickupRequest;
import com.rental.dto.RentalRequest;
import com.rental.dto.ReturnRequest;
import com.rental.entity.*;
import com.rental.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalService {

    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    private final CompensationOrderRepository compensationOrderRepository;
    private final RepairOrderRepository repairOrderRepository;

    @Value("${rental.violation-observation-days:7}")
    private int violationObservationDays;

    @Value("${rental.insurance-coverage-rate:0.8}")
    private double insuranceCoverageRate;

    @Value("${rental.mileage-fee-per-km:0.5}")
    private double mileageFeePerKm;

    @Value("${rental.fuel-fee-per-liter:8.0}")
    private double fuelFeePerLiter;

    private static final BigDecimal INSURANCE_DAILY_FEE = new BigDecimal("30");

    @Transactional
    public RentalOrder createRentalOrder(RentalRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new RuntimeException("车辆不存在"));

        validateRental(user, car, request);

        BigDecimal expectedRent = calculateExpectedRent(car, request);
        BigDecimal totalFrozenAmount = car.getDeposit().add(expectedRent);

        if (user.getBalance().compareTo(totalFrozenAmount) < 0) {
            throw new RuntimeException("余额不足，需要 " + totalFrozenAmount + " 元");
        }

        user.setBalance(user.getBalance().subtract(totalFrozenAmount));
        userRepository.save(user);

        RentalOrder order = RentalOrder.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .car(car)
                .status(RentalOrder.OrderStatus.RESERVED)
                .reservationTime(LocalDateTime.now())
                .expectedReturnTime(LocalDateTime.now().plusDays(request.getExpectedDays()))
                .expectedDays(request.getExpectedDays())
                .dailyRent(car.getDailyRent())
                .hasInsurance(request.getHasInsurance())
                .frozenDeposit(car.getDeposit())
                .frozenRent(expectedRent)
                .build();

        car.setStatus(Car.CarStatus.RESERVED);
        carRepository.save(car);

        return rentalOrderRepository.save(order);
    }

    @Transactional
    public RentalOrder pickupCar(PickupRequest request) {
        RentalOrder order = rentalOrderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (order.getStatus() != RentalOrder.OrderStatus.RESERVED) {
            throw new RuntimeException("订单状态不正确，无法取车");
        }

        Car car = order.getCar();
        
        if (request.getPickupMileage() < car.getMileage()) {
            throw new RuntimeException("取车里程不能小于车辆当前里程");
        }

        order.setStatus(RentalOrder.OrderStatus.PICKED_UP);
        order.setPickupTime(LocalDateTime.now());
        order.setPickupMileage(request.getPickupMileage());
        order.setPickupFuelLevel(request.getPickupFuelLevel());
        order.setRemark(request.getRemark());

        car.setStatus(Car.CarStatus.RENTED);
        car.setMileage(request.getPickupMileage());
        car.setFuelLevel(request.getPickupFuelLevel());
        carRepository.save(car);

        return rentalOrderRepository.save(order);
    }

    @Transactional
    public RentalOrder returnCar(ReturnRequest request) {
        RentalOrder order = rentalOrderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (order.getStatus() != RentalOrder.OrderStatus.PICKED_UP) {
            throw new RuntimeException("订单状态不正确，无法还车");
        }

        LocalDateTime actualReturnTime = LocalDateTime.now();
        order.setActualReturnTime(actualReturnTime);
        order.setReturnMileage(request.getReturnMileage());
        order.setReturnFuelLevel(request.getReturnFuelLevel());

        calculateRentalDays(order, actualReturnTime);
        calculateMileageFee(order);
        calculateFuelFee(order);
        calculateOverdueFee(order);
        calculateDamageFee(order, request.getDamages());
        calculateTotalAmount(order);

        order.setStatus(RentalOrder.OrderStatus.RETURNED);
        order.setViolationObservationEndTime(actualReturnTime.plusDays(violationObservationDays));
        order.setRemainingDeposit(order.getFrozenDeposit());

        Car car = order.getCar();
        car.setStatus(Car.CarStatus.AVAILABLE);
        car.setMileage(request.getReturnMileage());
        car.setFuelLevel(request.getReturnFuelLevel());
        carRepository.save(car);

        if (order.getActualDays() > order.getExpectedDays()) {
            User user = order.getUser();
            user.setOverdueCount(user.getOverdueCount() + 1);
            updateCreditLevel(user);
            userRepository.save(user);
        }

        return rentalOrderRepository.save(order);
    }

    @Transactional
    public RentalOrder settleOrder(Long orderId) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("订单不存在"));

        if (order.getStatus() != RentalOrder.OrderStatus.RETURNED) {
            throw new RuntimeException("订单状态不正确，无法结算");
        }

        BigDecimal totalToPay = order.getTotalAmount();
        BigDecimal frozenRent = order.getFrozenRent();

        if (frozenRent.compareTo(totalToPay) >= 0) {
            BigDecimal refund = frozenRent.subtract(totalToPay);
            User user = order.getUser();
            user.setBalance(user.getBalance().add(refund));
            order.setPaidAmount(totalToPay);
            userRepository.save(user);
        } else {
            BigDecimal additional = totalToPay.subtract(frozenRent);
            User user = order.getUser();
            if (user.getBalance().compareTo(additional) < 0) {
                throw new RuntimeException("余额不足，需要再支付 " + additional + " 元");
            }
            user.setBalance(user.getBalance().subtract(additional));
            order.setPaidAmount(totalToPay);
            userRepository.save(user);
        }

        order.setStatus(RentalOrder.OrderStatus.SETTLED);
        return rentalOrderRepository.save(order);
    }

    private void validateRental(User user, Car car, RentalRequest request) {
        if (user.getIsBlacklisted()) {
            throw new RuntimeException("用户已被列入黑名单，无法租车");
        }

        if (user.getCreditLevel() == User.CreditLevel.POOR) {
            throw new RuntimeException("用户信用等级过低，无法租车");
        }

        if (user.getLicenseIssueDate() == null) {
            throw new RuntimeException("用户驾照信息不完整");
        }

        long licenseYears = ChronoUnit.YEARS.between(user.getLicenseIssueDate(), LocalDateTime.now());
        if (licenseYears < 1 && car.getType() == Car.CarType.LUXURY) {
            throw new RuntimeException("驾照未满1年，无法租用豪华车型");
        }

        if (car.getStatus() != Car.CarStatus.AVAILABLE) {
            throw new RuntimeException("车辆当前不可用");
        }
    }

    private BigDecimal calculateExpectedRent(Car car, RentalRequest request) {
        BigDecimal baseRent = car.getDailyRent().multiply(BigDecimal.valueOf(request.getExpectedDays()));
        if (request.getHasInsurance()) {
            BigDecimal insuranceFee = INSURANCE_DAILY_FEE.multiply(BigDecimal.valueOf(request.getExpectedDays()));
            baseRent = baseRent.add(insuranceFee);
        }
        return baseRent;
    }

    private void calculateRentalDays(RentalOrder order, LocalDateTime actualReturnTime) {
        long hours = ChronoUnit.HOURS.between(order.getPickupTime(), actualReturnTime);
        int actualDays = (int) Math.ceil(hours / 24.0);
        if (actualDays < 1) actualDays = 1;
        order.setActualDays(actualDays);
        
        BigDecimal baseRent = order.getDailyRent().multiply(BigDecimal.valueOf(actualDays));
        if (order.getHasInsurance()) {
            BigDecimal insuranceFee = INSURANCE_DAILY_FEE.multiply(BigDecimal.valueOf(actualDays));
            baseRent = baseRent.add(insuranceFee);
        }
        order.setTotalRent(baseRent);
    }

    private void calculateMileageFee(RentalOrder order) {
        if (order.getReturnMileage() <= order.getPickupMileage()) {
            order.setMileageFee(BigDecimal.ZERO);
            order.setExtraMileage(0.0);
            return;
        }
        
        double extraMileage = order.getReturnMileage() - order.getPickupMileage();
        double dailyFreeMileage = 200.0;
        double freeMileage = dailyFreeMileage * order.getActualDays();
        double excessMileage = Math.max(0, extraMileage - freeMileage);
        
        order.setExtraMileage(extraMileage);
        order.setMileageFee(BigDecimal.valueOf(excessMileage * mileageFeePerKm)
                .setScale(2, RoundingMode.HALF_UP));
    }

    private void calculateFuelFee(RentalOrder order) {
        if (order.getReturnFuelLevel() >= order.getPickupFuelLevel()) {
            order.setFuelFee(BigDecimal.ZERO);
            order.setFuelDeficit(0.0);
            return;
        }
        
        double fuelDeficit = order.getPickupFuelLevel() - order.getReturnFuelLevel();
        order.setFuelDeficit(fuelDeficit);
        order.setFuelFee(BigDecimal.valueOf(fuelDeficit * fuelFeePerLiter)
                .setScale(2, RoundingMode.HALF_UP));
    }

    private void calculateOverdueFee(RentalOrder order) {
        if (order.getActualReturnTime().isBefore(order.getExpectedReturnTime())
                || order.getActualReturnTime().isEqual(order.getExpectedReturnTime())) {
            order.setOverdueFee(BigDecimal.ZERO);
            return;
        }
        
        long overdueHours = ChronoUnit.HOURS.between(order.getExpectedReturnTime(), order.getActualReturnTime());
        double overdueRate = 1.5;
        BigDecimal hourlyRate = order.getDailyRent().divide(BigDecimal.valueOf(24), 2, RoundingMode.HALF_UP);
        BigDecimal overdueFee = hourlyRate.multiply(BigDecimal.valueOf(overdueHours))
                .multiply(BigDecimal.valueOf(overdueRate))
                .setScale(2, RoundingMode.HALF_UP);
        
        order.setOverdueFee(overdueFee);
    }

    private void calculateDamageFee(RentalOrder order, List<ReturnRequest.DamageInfo> damages) {
        if (damages == null || damages.isEmpty()) {
            order.setDamageFee(BigDecimal.ZERO);
            order.setInsuranceCoverage(BigDecimal.ZERO);
            return;
        }

        BigDecimal totalDamageFee = BigDecimal.ZERO;
        BigDecimal totalInsuranceCoverage = BigDecimal.ZERO;

        for (ReturnRequest.DamageInfo damage : damages) {
            RepairOrder repairOrder = createRepairOrder(order, damage);
            
            BigDecimal estimatedCost = damage.getEstimatedCost();
            if (order.getHasInsurance()) {
                BigDecimal coverage = estimatedCost.multiply(BigDecimal.valueOf(insuranceCoverageRate))
                        .setScale(2, RoundingMode.HALF_UP);
                BigDecimal userPay = estimatedCost.subtract(coverage);
                
                totalDamageFee = totalDamageFee.add(userPay);
                totalInsuranceCoverage = totalInsuranceCoverage.add(coverage);
                
                createCompensationOrder(order, repairOrder, estimatedCost, userPay, coverage);
            } else {
                totalDamageFee = totalDamageFee.add(estimatedCost);
                createCompensationOrder(order, repairOrder, estimatedCost, estimatedCost, BigDecimal.ZERO);
            }
        }

        order.setDamageFee(totalDamageFee);
        order.setInsuranceCoverage(totalInsuranceCoverage);
    }

    private RepairOrder createRepairOrder(RentalOrder order, ReturnRequest.DamageInfo damage) {
        RepairOrder repairOrder = RepairOrder.builder()
                .orderNumber(generateRepairOrderNumber())
                .rentalOrder(order)
                .car(order.getCar())
                .type(mapDamageType(damage.getType()))
                .description(damage.getDescription())
                .damageLocation(damage.getLocation())
                .damageLevel(mapDamageLevel(damage.getLevel()))
                .estimatedCost(damage.getEstimatedCost())
                .status(RepairOrder.RepairStatus.PENDING)
                .reportedTime(LocalDateTime.now())
                .build();
        return repairOrderRepository.save(repairOrder);
    }

    private CompensationOrder createCompensationOrder(RentalOrder order, RepairOrder repairOrder,
                                                       BigDecimal totalAmount, BigDecimal userPay, 
                                                       BigDecimal insurancePay) {
        CompensationOrder compensation = CompensationOrder.builder()
                .orderNumber(generateCompensationOrderNumber())
                .rentalOrder(order)
                .repairOrder(repairOrder)
                .user(order.getUser())
                .car(order.getCar())
                .type(CompensationOrder.CompensationType.DAMAGE)
                .description("车辆损坏赔偿")
                .totalAmount(totalAmount)
                .userPayAmount(userPay)
                .insurancePayAmount(insurancePay)
                .status(CompensationOrder.CompensationStatus.PENDING)
                .build();
        return compensationOrderRepository.save(compensation);
    }

    private void calculateTotalAmount(RentalOrder order) {
        BigDecimal total = order.getTotalRent()
                .add(order.getMileageFee() != null ? order.getMileageFee() : BigDecimal.ZERO)
                .add(order.getFuelFee() != null ? order.getFuelFee() : BigDecimal.ZERO)
                .add(order.getOverdueFee() != null ? order.getOverdueFee() : BigDecimal.ZERO)
                .add(order.getDamageFee() != null ? order.getDamageFee() : BigDecimal.ZERO);
        order.setTotalAmount(total);
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

    private RepairOrder.RepairType mapDamageType(String type) {
        if (type == null) return RepairOrder.RepairType.OTHER;
        try {
            return RepairOrder.RepairType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return RepairOrder.RepairType.OTHER;
        }
    }

    private RepairOrder.DamageLevel mapDamageLevel(String level) {
        if (level == null) return RepairOrder.DamageLevel.MINOR;
        try {
            return RepairOrder.DamageLevel.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            return RepairOrder.DamageLevel.MINOR;
        }
    }

    private String generateOrderNumber() {
        return "RN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private String generateRepairOrderNumber() {
        return "RO" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private String generateCompensationOrderNumber() {
        return "CO" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    public List<RentalOrder> getUserOrders(Long userId) {
        return rentalOrderRepository.findByUserId(userId);
    }

    public Optional<RentalOrder> getOrderById(Long orderId) {
        return rentalOrderRepository.findById(orderId);
    }

    public List<RentalOrder> getAllOrders() {
        return rentalOrderRepository.findAll();
    }
}
