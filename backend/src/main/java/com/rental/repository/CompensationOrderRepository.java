package com.rental.repository;

import com.rental.entity.CompensationOrder;
import com.rental.entity.CompensationOrder.CompensationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompensationOrderRepository extends JpaRepository<CompensationOrder, Long> {
    Optional<CompensationOrder> findByOrderNumber(String orderNumber);
    List<CompensationOrder> findByRentalOrderId(Long rentalOrderId);
    List<CompensationOrder> findByRepairOrderId(Long repairOrderId);
    List<CompensationOrder> findByUserId(Long userId);
    List<CompensationOrder> findByCarId(Long carId);
    List<CompensationOrder> findByStatus(CompensationStatus status);
    List<CompensationOrder> findByRentalOrderIdAndStatus(Long rentalOrderId, CompensationStatus status);
}
