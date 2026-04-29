package com.rental.controller;

import com.rental.dto.ApiResponse;
import com.rental.entity.RentalOrder;
import com.rental.service.DepositService;
import com.rental.service.RentalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/deposits")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3004")
public class DepositController {

    private final DepositService depositService;
    private final RentalService rentalService;

    @PostMapping("/{orderId}/release")
    public ResponseEntity<ApiResponse<RentalOrder>> releaseDeposit(@PathVariable Long orderId) {
        try {
            Optional<RentalOrder> orderOpt = rentalService.getOrderById(orderId);
            if (!orderOpt.isPresent()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("订单不存在"));
            }
            
            RentalOrder order = orderOpt.get();
            
            if (order.getDepositReleased() != null && order.getDepositReleased()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("押金已释放"));
            }
            
            if (order.getStatus() != RentalOrder.OrderStatus.SETTLED) {
                return ResponseEntity.badRequest().body(ApiResponse.error("订单尚未结算，无法释放押金"));
            }
            
            depositService.releaseRemainingDeposit(order);
            
            Optional<RentalOrder> updatedOrder = rentalService.getOrderById(orderId);
            return ResponseEntity.ok(ApiResponse.success("押金释放成功", updatedOrder.orElse(order)));
            
        } catch (RuntimeException e) {
            log.error("释放押金失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/force-release")
    public ResponseEntity<ApiResponse<RentalOrder>> forceReleaseDeposit(@PathVariable Long orderId) {
        try {
            Optional<RentalOrder> orderOpt = rentalService.getOrderById(orderId);
            if (!orderOpt.isPresent()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("订单不存在"));
            }
            
            RentalOrder order = orderOpt.get();
            
            if (order.getDepositReleased() != null && order.getDepositReleased()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("押金已释放"));
            }
            
            depositService.releaseRemainingDeposit(order);
            
            Optional<RentalOrder> updatedOrder = rentalService.getOrderById(orderId);
            return ResponseEntity.ok(ApiResponse.success("押金强制释放成功", updatedOrder.orElse(order)));
            
        } catch (RuntimeException e) {
            log.error("强制释放押金失败: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
