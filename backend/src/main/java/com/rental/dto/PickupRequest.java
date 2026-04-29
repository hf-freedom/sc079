package com.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupRequest {

    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "取车时里程不能为空")
    @Positive(message = "里程必须大于0")
    private Double pickupMileage;

    @NotNull(message = "取车时油量不能为空")
    @Positive(message = "油量必须大于0")
    private Double pickupFuelLevel;

    private String remark;
}
