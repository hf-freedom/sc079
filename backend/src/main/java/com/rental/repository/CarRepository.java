package com.rental.repository;

import com.rental.entity.Car;
import com.rental.entity.Car.CarStatus;
import com.rental.entity.Car.CarType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {
    Optional<Car> findByPlateNumber(String plateNumber);
    List<Car> findByStatus(CarStatus status);
    List<Car> findByType(CarType type);
    List<Car> findByStatusAndType(CarStatus status, CarType type);
    boolean existsByPlateNumber(String plateNumber);
}
