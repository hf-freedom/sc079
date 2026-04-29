package com.rental.service;

import com.rental.entity.Car;
import com.rental.entity.Car.CarStatus;
import com.rental.entity.Car.CarType;
import com.rental.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;

    public List<Car> getAllCars() {
        return carRepository.findAll();
    }

    public List<Car> getAvailableCars() {
        return carRepository.findByStatus(CarStatus.AVAILABLE);
    }

    public List<Car> getCarsByType(CarType type) {
        return carRepository.findByType(type);
    }

    public Optional<Car> getCarById(Long id) {
        return carRepository.findById(id);
    }

    public Optional<Car> getCarByPlateNumber(String plateNumber) {
        return carRepository.findByPlateNumber(plateNumber);
    }

    @Transactional
    public Car createCar(Car car) {
        if (carRepository.existsByPlateNumber(car.getPlateNumber())) {
            throw new RuntimeException("车牌号已存在");
        }
        car.setStatus(CarStatus.AVAILABLE);
        return carRepository.save(car);
    }

    @Transactional
    public Car updateCar(Long id, Car carDetails) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("车辆不存在"));

        car.setBrand(carDetails.getBrand());
        car.setModel(carDetails.getModel());
        car.setType(carDetails.getType());
        car.setDailyRent(carDetails.getDailyRent());
        car.setDeposit(carDetails.getDeposit());
        car.setMileage(carDetails.getMileage());
        car.setFuelLevel(carDetails.getFuelLevel());
        car.setProductionYear(carDetails.getProductionYear());
        car.setColor(carDetails.getColor());
        
        return carRepository.save(car);
    }

    @Transactional
    public Car updateCarStatus(Long id, CarStatus status) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("车辆不存在"));
        
        car.setStatus(status);
        log.info("车辆 {} 状态更新为: {}", car.getPlateNumber(), status);
        
        return carRepository.save(car);
    }

    @Transactional
    public void deleteCar(Long id) {
        Car car = carRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("车辆不存在"));
        
        if (car.getStatus() == CarStatus.RENTED || car.getStatus() == CarStatus.RESERVED) {
            throw new RuntimeException("车辆当前被租用或预订，无法删除");
        }
        
        carRepository.delete(car);
        log.info("已删除车辆: {}", car.getPlateNumber());
    }

    public long getCarCount() {
        return carRepository.count();
    }

    public long getAvailableCarCount() {
        return carRepository.findByStatus(CarStatus.AVAILABLE).size();
    }
}
