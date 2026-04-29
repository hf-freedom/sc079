package com.rental.controller;

import com.rental.dto.ApiResponse;
import com.rental.dto.PickupRequest;
import com.rental.dto.RentalRequest;
import com.rental.dto.ReturnRequest;
import com.rental.entity.RentalOrder;
import com.rental.service.RentalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3004")
public class RentalController {

    private final RentalService rentalService;

    @PostMapping("/reserve")
    public ResponseEntity<ApiResponse<RentalOrder>> reserveCar(@Valid @RequestBody RentalRequest request) {
        try {
            RentalOrder order = rentalService.createRentalOrder(request);
            return ResponseEntity.ok(ApiResponse.success("预订成功", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/pickup")
    public ResponseEntity<ApiResponse<RentalOrder>> pickupCar(@Valid @RequestBody PickupRequest request) {
        try {
            RentalOrder order = rentalService.pickupCar(request);
            return ResponseEntity.ok(ApiResponse.success("取车成功", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/return")
    public ResponseEntity<ApiResponse<RentalOrder>> returnCar(@Valid @RequestBody ReturnRequest request) {
        try {
            RentalOrder order = rentalService.returnCar(request);
            return ResponseEntity.ok(ApiResponse.success("还车成功", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/settle")
    public ResponseEntity<ApiResponse<RentalOrder>> settleOrder(@PathVariable Long orderId) {
        try {
            RentalOrder order = rentalService.settleOrder(orderId);
            return ResponseEntity.ok(ApiResponse.success("结算成功", order));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<RentalOrder>> getOrderById(@PathVariable Long orderId) {
        return rentalService.getOrderById(orderId)
                .map(order -> ResponseEntity.ok(ApiResponse.success(order)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<RentalOrder>>> getUserOrders(@PathVariable Long userId) {
        List<RentalOrder> orders = rentalService.getUserOrders(userId);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RentalOrder>>> getAllOrders() {
        List<RentalOrder> orders = rentalService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }
}
