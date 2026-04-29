package com.rental.controller;

import com.rental.dto.ApiResponse;
import com.rental.entity.Car;
import com.rental.entity.Car.CarStatus;
import com.rental.entity.Car.CarType;
import com.rental.service.CarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3004")
public class CarController {

    private final CarService carService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Car>>> getAllCars() {
        List<Car> cars = carService.getAllCars();
        return ResponseEntity.ok(ApiResponse.success(cars));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Car>>> getAvailableCars() {
        List<Car> cars = carService.getAvailableCars();
        return ResponseEntity.ok(ApiResponse.success(cars));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<Car>>> getCarsByType(@PathVariable CarType type) {
        List<Car> cars = carService.getCarsByType(type);
        return ResponseEntity.ok(ApiResponse.success(cars));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Car>> getCarById(@PathVariable Long id) {
        return carService.getCarById(id)
                .map(car -> ResponseEntity.ok(ApiResponse.success(car)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/plate/{plateNumber}")
    public ResponseEntity<ApiResponse<Car>> getCarByPlateNumber(@PathVariable String plateNumber) {
        return carService.getCarByPlateNumber(plateNumber)
                .map(car -> ResponseEntity.ok(ApiResponse.success(car)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Car>> createCar(@RequestBody Car car) {
        try {
            Car createdCar = carService.createCar(car);
            return ResponseEntity.ok(ApiResponse.success("车辆创建成功", createdCar));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Car>> updateCar(@PathVariable Long id, @RequestBody Car car) {
        try {
            Car updatedCar = carService.updateCar(id, car);
            return ResponseEntity.ok(ApiResponse.success("车辆更新成功", updatedCar));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Car>> updateCarStatus(
            @PathVariable Long id, 
            @RequestParam CarStatus status) {
        try {
            Car updatedCar = carService.updateCarStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("车辆状态更新成功", updatedCar));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCar(@PathVariable Long id) {
        try {
            carService.deleteCar(id);
            return ResponseEntity.ok(ApiResponse.success("车辆删除成功", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats/count")
    public ResponseEntity<ApiResponse<Long>> getCarCount() {
        long count = carService.getCarCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/stats/available-count")
    public ResponseEntity<ApiResponse<Long>> getAvailableCarCount() {
        long count = carService.getAvailableCarCount();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
