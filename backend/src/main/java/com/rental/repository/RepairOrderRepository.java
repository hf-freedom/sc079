package com.rental.repository;

import com.rental.entity.RepairOrder;
import com.rental.entity.RepairOrder.RepairStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends JpaRepository<RepairOrder, Long> {
    Optional<RepairOrder> findByOrderNumber(String orderNumber);
    List<RepairOrder> findByRentalOrderId(Long rentalOrderId);
    List<RepairOrder> findByCarId(Long carId);
    List<RepairOrder> findByStatus(RepairStatus status);
    List<RepairOrder> findByRentalOrderIdAndStatus(Long rentalOrderId, RepairStatus status);
}
