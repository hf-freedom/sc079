package com.rental.service;

import com.rental.entity.RentalOrder;
import com.rental.entity.RentalOrder.OrderStatus;
import com.rental.entity.User;
import com.rental.repository.RentalOrderRepository;
import com.rental.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DepositService {

    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * ?")
    @Transactional
    public void releaseDepositSchedule() {
        log.info("开始执行押金释放定时任务...");
        
        LocalDateTime now = LocalDateTime.now();
        List<RentalOrder> orders = rentalOrderRepository.findOrdersReadyForDepositRelease(
                now, OrderStatus.SETTLED);
        
        log.info("找到 {} 个待释放押金的订单", orders.size());
        
        for (RentalOrder order : orders) {
            try {
                releaseRemainingDeposit(order);
            } catch (Exception e) {
                log.error("释放订单 {} 押金时发生错误: {}", order.getOrderNumber(), e.getMessage(), e);
            }
        }
        
        log.info("押金释放定时任务执行完成");
    }

    @Transactional
    public void releaseRemainingDeposit(RentalOrder order) {
        if (order.getDepositReleased() != null && order.getDepositReleased()) {
            log.warn("订单 {} 押金已释放", order.getOrderNumber());
            return;
        }

        BigDecimal remainingDeposit = order.getRemainingDeposit();
        if (remainingDeposit == null) {
            remainingDeposit = order.getFrozenDeposit();
        }

        if (remainingDeposit.compareTo(BigDecimal.ZERO) > 0) {
            User user = order.getUser();
            user.setBalance(user.getBalance().add(remainingDeposit));
            userRepository.save(user);
            log.info("订单 {}: 释放押金 {} 元到用户 {} 账户", 
                    order.getOrderNumber(), remainingDeposit, user.getUsername());
        } else {
            log.info("订单 {}: 无剩余押金可释放", order.getOrderNumber());
        }

        order.setDepositReleased(true);
        rentalOrderRepository.save(order);
    }

    @Transactional
    public void processOverdueOrders() {
        log.info("开始检查逾期订单...");
        
        LocalDateTime now = LocalDateTime.now();
        List<RentalOrder> overdueOrders = rentalOrderRepository.findOverdueOrders(
                now, OrderStatus.PICKED_UP);
        
        log.info("找到 {} 个逾期订单", overdueOrders.size());
        
        for (RentalOrder order : overdueOrders) {
            try {
                User user = order.getUser();
                user.setOverdueCount(user.getOverdueCount() + 1);
                
                int totalNegative = user.getViolationCount() + user.getOverdueCount() * 2;
                if (totalNegative >= 5) {
                    user.setCreditLevel(User.CreditLevel.POOR);
                    user.setIsBlacklisted(true);
                    log.warn("用户 {} 逾期次数过多，已加入黑名单", user.getUsername());
                } else if (totalNegative >= 3) {
                    user.setCreditLevel(User.CreditLevel.FAIR);
                }
                
                userRepository.save(user);
                log.info("订单 {} 已逾期，用户 {} 逾期计数更新", order.getOrderNumber(), user.getUsername());
            } catch (Exception e) {
                log.error("处理逾期订单 {} 时发生错误: {}", order.getOrderNumber(), e.getMessage(), e);
            }
        }
        
        log.info("逾期订单检查完成");
    }

    public BigDecimal getUserFrozenDeposit(Long userId) {
        List<RentalOrder> activeOrders = rentalOrderRepository.findByUserIdAndStatus(
                userId, OrderStatus.RESERVED);
        activeOrders.addAll(rentalOrderRepository.findByUserIdAndStatus(
                userId, OrderStatus.PICKED_UP));
        activeOrders.addAll(rentalOrderRepository.findByUserIdAndStatus(
                userId, OrderStatus.RETURNED));

        return activeOrders.stream()
                .filter(order -> order.getDepositReleased() == null || !order.getDepositReleased())
                .map(order -> order.getRemainingDeposit() != null 
                        ? order.getRemainingDeposit() 
                        : order.getFrozenDeposit())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
