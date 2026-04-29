package com.rental.repository;

import com.rental.entity.Violation;
import com.rental.entity.Violation.ViolationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {
    List<Violation> findByRentalOrderId(Long rentalOrderId);
    List<Violation> findByUserId(Long userId);
    List<Violation> findByCarId(Long carId);
    List<Violation> findByStatus(ViolationStatus status);
    List<Violation> findByRentalOrderIdAndStatus(Long rentalOrderId, ViolationStatus status);
    List<Violation> findByUserIdAndStatus(Long userId, ViolationStatus status);
}
