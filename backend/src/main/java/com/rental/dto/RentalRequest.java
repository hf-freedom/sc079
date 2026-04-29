package com.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalRequest {

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotNull(message = "车辆ID不能为空")
    private Long carId;

    @NotNull(message = "预计租车天数不能为空")
    @Positive(message = "租车天数必须大于0")
    private Integer expectedDays;

    @NotNull(message = "是否购买保险不能为空")
    private Boolean hasInsurance;

    private LocalDateTime pickupTime;
}
