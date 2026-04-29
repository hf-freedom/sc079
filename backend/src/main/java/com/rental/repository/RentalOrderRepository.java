package com.rental.repository;

import com.rental.entity.RentalOrder;
import com.rental.entity.RentalOrder.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RentalOrderRepository extends JpaRepository<RentalOrder, Long> {
    Optional<RentalOrder> findByOrderNumber(String orderNumber);
    List<RentalOrder> findByUserId(Long userId);
    List<RentalOrder> findByCarId(Long carId);
    List<RentalOrder> findByStatus(OrderStatus status);
    List<RentalOrder> findByUserIdAndStatus(Long userId, OrderStatus status);
    List<RentalOrder> findByCarIdAndStatus(Long carId, OrderStatus status);
    
    @Query("SELECT ro FROM RentalOrder ro WHERE ro.status = :status " +
           "AND ro.violationObservationEndTime IS NOT NULL " +
           "AND ro.violationObservationEndTime <= :now " +
           "AND ro.depositReleased = false")
    List<RentalOrder> findOrdersReadyForDepositRelease(@Param("now") LocalDateTime now, 
                                                          @Param("status") OrderStatus status);
    
    @Query("SELECT ro FROM RentalOrder ro WHERE ro.status = :status " +
           "AND ro.expectedReturnTime <= :now")
    List<RentalOrder> findOverdueOrders(@Param("now") LocalDateTime now, 
                                          @Param("status") OrderStatus status);
}
