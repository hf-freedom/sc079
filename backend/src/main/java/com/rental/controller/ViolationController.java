package com.rental.controller;

import com.rental.dto.ApiResponse;
import com.rental.dto.ViolationImportRequest;
import com.rental.entity.Violation;
import com.rental.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/violations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3004")
public class ViolationController {

    private final ViolationService violationService;

    @PostMapping("/import")
    public ResponseEntity<ApiResponse<Violation>> importViolation(@Valid @RequestBody ViolationImportRequest request) {
        try {
            Violation violation = violationService.importViolation(request);
            return ResponseEntity.ok(ApiResponse.success("违章导入成功", violation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Violation>>> getViolationsByUser(@PathVariable Long userId) {
        List<Violation> violations = violationService.getViolationsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(violations));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<List<Violation>>> getViolationsByOrder(@PathVariable Long orderId) {
        List<Violation> violations = violationService.getViolationsByOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(violations));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<Violation>>> getPendingViolations() {
        List<Violation> violations = violationService.getPendingViolations();
        return ResponseEntity.ok(ApiResponse.success(violations));
    }
}
